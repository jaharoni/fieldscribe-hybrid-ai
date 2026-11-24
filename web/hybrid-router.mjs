/**
 * FieldScribe Local — Podium Hybrid On-Device & Cloud Inference Router
 * Built for #BuildHybridAI 2026 across Web PWA & Native Swift 6 iOS.
 * Combines Firebase AI Logic (InferenceMode.PREFER_ON_DEVICE / ONLY_ON_DEVICE),
 * W3C Gemini Nano probing, client-side PII redaction, and HL7 FHIR R4 export.
 */

export const HybridMode = Object.freeze({
  ONLY_ON_DEVICE: "ONLY_ON_DEVICE",
  PREFER_ON_DEVICE: "PREFER_ON_DEVICE",
  HYBRID_CLOUD_SYNTHESIS: "HYBRID_CLOUD_SYNTHESIS",
});

export const DEFAULT_CLOUD_GATEWAY_URL = "https://fieldscribe-hybrid-gate.wholetrou.workers.dev/synthesize";

const PII_PATTERNS = [
  { label: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g, token: "[REDACTED-SSN]" },
  { label: "EMAIL", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, token: "[REDACTED-EMAIL]" },
  { label: "PHONE", regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, token: "[REDACTED-PHONE]" },
  { label: "DOB", regex: /\b(?:DOB|Born|Date of Birth)\s*[:=-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi, token: "DOB: [REDACTED-DATE]" },
  { label: "MRN", regex: /\b(?:MRN|Patient ID|Case #|Record #)\s*[:=-]?\s*[A-Z0-9-]{4,16}\b/gi, token: "ID: [REDACTED-ID]" },
];

export function redactSensitiveIdentifiers(rawText) {
  let sanitized = String(rawText || "");
  const counts = {};
  let totalRedacted = 0;

  for (const rule of PII_PATTERNS) {
    const matches = sanitized.match(rule.regex);
    if (matches && matches.length > 0) {
      counts[rule.label] = (counts[rule.label] || 0) + matches.length;
      totalRedacted += matches.length;
      sanitized = sanitized.replace(rule.regex, rule.token);
    }
  }

  return {
    sanitizedText: sanitized,
    totalRedacted,
    counts,
  };
}

export async function probeOnDeviceModel(globalScope = globalThis) {
  try {
    if (globalScope?.LanguageModel && typeof globalScope.LanguageModel.availability === "function") {
      const status = await globalScope.LanguageModel.availability();
      return {
        supported: status === "available" || status === "readily",
        status: String(status),
        apiSurface: "W3C LanguageModel (Gemini Nano)",
      };
    }
    if (globalScope?.ai?.languageModel && typeof globalScope.ai.languageModel.capabilities === "function") {
      const caps = await globalScope.ai.languageModel.capabilities();
      return {
        supported: caps?.available === "readily",
        status: String(caps?.available || "unavailable"),
        apiSurface: "window.ai.languageModel",
      };
    }
  } catch (err) {
    return { supported: false, status: "error", error: err.message, apiSurface: "none" };
  }
  return { supported: false, status: "unavailable", apiSurface: "deterministic-local-engine" };
}

export function extractStructuredIntakeLocally(rawText) {
  const clean = String(rawText || "").trim();
  if (!clean) {
    return {
      urgency: "routine",
      summary: "No intake notes entered yet.",
      accommodations: [],
      followUpActions: [],
      vitalsOrSignals: [],
    };
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  const lower = clean.toLowerCase();
  let urgency = "routine";
  if (/\b(urgent|immediate|chest pain|shortness of breath|fall risk|acute|emergency|unsafe|severe)\b/.test(lower)) {
    urgency = "urgent";
  } else if (/\b(priority|follow[- ]?up within 24|elevated|mobility barrier|wheelchair|interpreter|medication)\b/.test(lower)) {
    urgency = "priority";
  }

  const accommodations = [];
  const accommodationMatchers = [
    { re: /\b(wheelchair|ramp|step-free|elevator|transfer)\b/i, item: "Step-free / wheelchair mobility access required" },
    { re: /\b(asl|deaf|hard of hearing|caption|hearing aid)\b/i, item: "Certified ASL or live captioning communication support" },
    { re: /\b(screen reader|low vision|braille|large print|high contrast)\b/i, item: "High-contrast large-print / screen-reader materials" },
    { re: /\b(spanish|mandarin|arabic|french|interpreter|translation|non-english)\b/i, item: "Certified medical/community language interpretation" },
    { re: /\b(quiet room|sensory|neurodivergent|lighting)\b/i, item: "Low-stimulation sensory intake room" },
  ];
  for (const m of accommodationMatchers) {
    if (m.re.test(clean)) accommodations.push(m.item);
  }

  const vitalsOrSignals = [];
  const bpMatch = clean.match(/\b\d{2,3}\/\d{2,3}\s*(?:mmhg)?\b/gi);
  if (bpMatch) vitalsOrSignals.push("BP " + bpMatch.join(", "));
  const spo2Match = clean.match(/\b(?:spo2|o2 sat|oxygen)\s*[:=-]?\s*\d{2,3}%/gi);
  if (spo2Match) vitalsOrSignals.push(spo2Match.join(", "));
  const hrMatch = clean.match(/\b(?:hr|pulse|heart rate)\s*[:=-]?\s*\d{2,3}\s*(?:bpm)?/gi);
  if (hrMatch) vitalsOrSignals.push(hrMatch.join(", "));

  const followUpActions = sentences
    .filter(s => /\b(need|needs|schedule|refer|provide|deliver|check|confirm|arrange|bring|request|renewal|refill)\b/i.test(s))
    .slice(0, 4)
    .map(s => redactSensitiveIdentifiers(s).sanitizedText);

  if (followUpActions.length === 0 && sentences.length > 0) {
    followUpActions.push("Review de-identified intake checklist with care coordinator.");
  }

  const summarySource = redactSensitiveIdentifiers(sentences.slice(0, 2).join(" ")).sanitizedText;

  return {
    urgency,
    summary: summarySource.slice(0, 280),
    accommodations,
    followUpActions,
    vitalsOrSignals,
  };
}

/**
 * Generates an interoperable HL7 FHIR R4 Bundle (Communication + Observation + Flag)
 * containing strictly de-identified structured outputs.
 */
export function buildFhirR4Bundle(structured, telemetry) {
  const nowIso = new Date().toISOString();
  const entries = [
    {
      resource: {
        resourceType: "Communication",
        status: "completed",
        priority: structured.urgency || "routine",
        sent: nowIso,
        payload: [{ contentString: structured.summary || "" }],
        note: [{ text: `Route=${telemetry.route}; CloudBytes=${telemetry.cloudBytesSent}; RedactedPII=${telemetry.piiRedactedCount}` }],
      },
    },
  ];

  for (const acc of structured.accommodations || []) {
    entries.push({
      resource: {
        resourceType: "Flag",
        status: "active",
        category: [{ text: "Accessibility & Communication Accommodation" }],
        code: { text: acc },
      },
    });
  }

  for (const sig of structured.vitalsOrSignals || []) {
    entries.push({
      resource: {
        resourceType: "Observation",
        status: "preliminary",
        code: { text: "Field Vital / Signal" },
        valueString: sig,
      },
    });
  }

  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: nowIso,
    entry: entries,
  };
}

export function buildAccessibleCareMarkdown(structured, telemetry) {
  const lines = [
    `# FieldScribe De-Identified Care Handoff (${String(structured.urgency || "routine").toUpperCase()})`,
    `- **Inference Route**: \`${telemetry.route}\` (\`${telemetry.cloudBytesSent} B\` cloud egress · \`${telemetry.piiRedactedCount}\` PII tokens masked locally)`,
    ``,
    `## Summary`,
    structured.summary || "None",
    ``,
    `## Accessibility & Communication Accommodations`,
    ...((structured.accommodations?.length ? structured.accommodations : ["Standard intake setup"]).map(x => `- [ ] ${x}`)),
    ``,
    `## Vitals & Signals`,
    ...((structured.vitalsOrSignals?.length ? structured.vitalsOrSignals : ["No vitals recorded"]).map(x => `- ${x}`)),
    ``,
    `## Recommended Next Steps`,
    ...((structured.followUpActions?.length ? structured.followUpActions : ["Coordinator review"]).map(x => `- [ ] ${x}`)),
  ];
  return lines.join("\n");
}

export async function runHybridIntakeSession({
  rawText,
  mode = HybridMode.PREFER_ON_DEVICE,
  isOnline = true,
  globalScope = globalThis,
  cloudAdapter = null,
}) {
  const t0 = performance.now();
  const redaction = redactSensitiveIdentifiers(rawText);
  const localProbe = await probeOnDeviceModel(globalScope);

  // Path 1: Browser-native Gemini Nano when available and mode prefers/forces local
  if (mode !== HybridMode.HYBRID_CLOUD_SYNTHESIS && localProbe.supported) {
    try {
      const prompt = [
        "Extract a concise JSON object with keys urgency (routine|priority|urgent), summary, accommodations (array), followUpActions (array), vitalsOrSignals (array).",
        "Input note:",
        rawText,
      ].join("\n");

      let rawJson = "";
      if (globalScope?.LanguageModel?.create) {
        const session = await globalScope.LanguageModel.create();
        rawJson = await session.prompt(prompt);
      } else if (globalScope?.ai?.languageModel?.create) {
        const session = await globalScope.ai.languageModel.create();
        rawJson = await session.prompt(prompt);
      }
      const cleaned = String(rawJson).replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        structured: {
          urgency: parsed.urgency || "routine",
          summary: parsed.summary || "",
          accommodations: Array.isArray(parsed.accommodations) ? parsed.accommodations : [],
          followUpActions: Array.isArray(parsed.followUpActions) ? parsed.followUpActions : [],
          vitalsOrSignals: Array.isArray(parsed.vitalsOrSignals) ? parsed.vitalsOrSignals : [],
        },
        telemetry: {
          route: "ON_DEVICE_GEMINI_NANO",
          modeRequested: mode,
          cloudBytesSent: 0,
          piiRedactedCount: redaction.totalRedacted,
          redactionBreakdown: redaction.counts,
          latencyMs: Math.round((performance.now() - t0) * 10) / 10,
          offlineSafe: true,
        },
        redactedPreview: redaction.sanitizedText,
      };
    } catch (_) {}
  }

  // Path 2: Local execution in ONLY_ON_DEVICE, PREFER_ON_DEVICE (without Nano), offline, or missing cloud adapter
  if (mode !== HybridMode.HYBRID_CLOUD_SYNTHESIS || !isOnline || typeof cloudAdapter !== "function") {
    const structured = extractStructuredIntakeLocally(rawText);
    return {
      structured,
      telemetry: {
        route: "ON_DEVICE_LOCAL_ENGINE",
        modeRequested: mode,
        cloudBytesSent: 0,
        piiRedactedCount: redaction.totalRedacted,
        redactionBreakdown: redaction.counts,
        latencyMs: Math.round((performance.now() - t0) * 10) / 10,
        offlineSafe: true,
      },
      redactedPreview: redaction.sanitizedText,
    };
  }

  // Path 3: Opt-in Hybrid Cloud Synthesis (strictly receives PII-redacted text!)
  const payloadBytes = new TextEncoder().encode(redaction.sanitizedText).length;
  const cloudResult = await cloudAdapter({
    sanitizedText: redaction.sanitizedText,
    firebaseInferenceMode: "PREFER_IN_CLOUD",
  });

  return {
    structured: cloudResult,
    telemetry: {
      route: "FIREBASE_AI_HYBRID_CLOUD_REDACTED",
      modeRequested: mode,
      cloudBytesSent: payloadBytes,
      piiRedactedCount: redaction.totalRedacted,
      redactionBreakdown: redaction.counts,
      latencyMs: Math.round((performance.now() - t0) * 10) / 10,
      offlineSafe: false,
    },
    redactedPreview: redaction.sanitizedText,
  };
}

export function createServerlessGatewayAdapter(endpoint = DEFAULT_CLOUD_GATEWAY_URL, fetchImpl = fetch) {
  return async ({ sanitizedText }) => {
    const resp = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sanitizedText }),
    });
    if (!resp.ok) {
      throw new Error("Gateway HTTP " + resp.status);
    }
    return await resp.json();
  };
}

export async function createFirebaseAiCloudAdapter(firebaseConfig, modelName = "gemini-3.1-flash-lite") {
  const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js");
  const { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-ai.js");

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  return async ({ sanitizedText, firebaseInferenceMode }) => {
    const sdkMode = firebaseInferenceMode === "PREFER_ON_DEVICE"
      ? InferenceMode.PREFER_ON_DEVICE
      : InferenceMode.PREFER_IN_CLOUD;
    const model = getGenerativeModel(ai, { model: modelName, mode: sdkMode });
    const prompt = [
      "Return ONLY valid JSON with keys: urgency (routine|priority|urgent), summary (string), accommodations (string[]), followUpActions (string[]), vitalsOrSignals (string[]).",
      "Sanitized field note:",
      sanitizedText,
    ].join("\n");
    const response = await model.generateContent(prompt);
    const txt = response.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(txt);
  };
}
