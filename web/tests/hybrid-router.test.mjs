import test from "node:test";
import assert from "node:assert/strict";
import {
  HybridMode,
  redactSensitiveIdentifiers,
  extractStructuredIntakeLocally,
  runHybridIntakeSession,
} from "../hybrid-router.mjs";

test("redactSensitiveIdentifiers strips SSN, phone, email, DOB, and MRN before cloud transmission", () => {
  const note = "Patient MRN: AB-992814, DOB: 04/19/1958, SSN 123-45-6789. Call (555) 234-5678 or email maria.lopez@example.org.";
  const res = redactSensitiveIdentifiers(note);

  assert.equal(res.totalRedacted, 5);
  assert.ok(!res.sanitizedText.includes("123-45-6789"));
  assert.ok(!res.sanitizedText.includes("555"));
  assert.ok(!res.sanitizedText.includes("maria.lopez@example.org"));
  assert.ok(!res.sanitizedText.includes("04/19/1958"));
  assert.ok(!res.sanitizedText.includes("AB-992814"));
});

test("extractStructuredIntakeLocally detects urgency, accessibility accommodations, and vitals offline", () => {
  const note = "Client uses a wheelchair and needs step-free ramp access plus Spanish interpreter. BP 148/92 mmHg, SpO2 97%. Needs urgent medication refill scheduled within 24 hours.";
  const out = extractStructuredIntakeLocally(note);

  assert.equal(out.urgency, "urgent");
  assert.ok(out.accommodations.some(a => a.includes("wheelchair")));
  assert.ok(out.accommodations.some(a => a.includes("interpretation")));
  assert.ok(out.vitalsOrSignals.some(v => v.includes("148/92")));
  assert.ok(out.followUpActions.length >= 1);
});

test("ONLY_ON_DEVICE guarantees 0 cloud bytes even when online and cloudAdapter exists", async () => {
  let cloudCalled = false;
  const res = await runHybridIntakeSession({
    rawText: "SSN 999-11-2222. Needs large print discharge forms and ramp access.",
    mode: HybridMode.ONLY_ON_DEVICE,
    isOnline: true,
    globalScope: {},
    cloudAdapter: async () => {
      cloudCalled = true;
      return {};
    },
  });

  assert.equal(cloudCalled, false);
  assert.equal(res.telemetry.cloudBytesSent, 0);
  assert.equal(res.telemetry.offlineSafe, true);
  assert.equal(res.telemetry.route, "ON_DEVICE_LOCAL_ENGINE");
});

test("PREFER_ON_DEVICE uses browser LanguageModel (Gemini Nano) when available with 0 cloud egress", async () => {
  const mockGlobal = {
    LanguageModel: {
      availability: async () => "available",
      create: async () => ({
        prompt: async () => JSON.stringify({
          urgency: "priority",
          summary: "Requires ASL interpreter for intake.",
          accommodations: ["ASL interpreter"],
          followUpActions: ["Confirm ASL booking"],
          vitalsOrSignals: [],
        }),
      }),
    },
  };

  const res = await runHybridIntakeSession({
    rawText: "Deaf client requires ASL interpreter for tomorrow clinic visit.",
    mode: HybridMode.PREFER_ON_DEVICE,
    isOnline: true,
    globalScope: mockGlobal,
  });

  assert.equal(res.telemetry.route, "ON_DEVICE_GEMINI_NANO");
  assert.equal(res.telemetry.cloudBytesSent, 0);
  assert.equal(res.structured.urgency, "priority");
  assert.deepEqual(res.structured.accommodations, ["ASL interpreter"]);
});

test("HYBRID_CLOUD_SYNTHESIS redacts PII before invoking Firebase AI Logic cloud adapter", async () => {
  let receivedPayload = "";
  const res = await runHybridIntakeSession({
    rawText: "Call 415-890-1234 or email caregiver@clinic.org. Wheelchair ramp needed at north entrance.",
    mode: HybridMode.HYBRID_CLOUD_SYNTHESIS,
    isOnline: true,
    globalScope: {},
    cloudAdapter: async ({ sanitizedText }) => {
      receivedPayload = sanitizedText;
      return {
        urgency: "priority",
        summary: "Arrange north entrance wheelchair ramp.",
        accommodations: ["Wheelchair ramp"],
        followUpActions: ["Notify facilities"],
        vitalsOrSignals: [],
      };
    },
  });

  assert.ok(!receivedPayload.includes("415-890-1234"));
  assert.ok(!receivedPayload.includes("caregiver@clinic.org"));
  assert.ok(receivedPayload.includes("[REDACTED-PHONE]"));
  assert.ok(receivedPayload.includes("[REDACTED-EMAIL]"));
  assert.ok(res.telemetry.cloudBytesSent > 0);
  assert.equal(res.telemetry.piiRedactedCount, 2);
  assert.equal(res.telemetry.route, "FIREBASE_AI_HYBRID_CLOUD_REDACTED");
});
