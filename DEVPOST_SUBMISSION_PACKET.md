# Devpost Submission Packet — `#BuildHybridAI 2026`

- **Event URL**: `https://firebasehybridaihackathon.devpost.com/`
- **Project Title**: `FieldScribe Local`
- **Tagline**: Privacy-first hybrid on-device + cloud accessibility and clinical field-intake studio across Web & iOS (`0 bytes` raw PII cloud egress).

---

## Copy-Paste Devpost Description (Mapped 1:1 to Judging Rubric)

### Inspiration
Community health workers, home-visit caregivers, and accessibility coordinators constantly record sensitive intake notes in rural homes, hospital basements, and transit corridors where connectivity is unreliable and sending raw personal identifiers (SSNs, MRNs, dates of birth, phone numbers) to cloud endpoints is unacceptable. Hybrid AI solves both problems at once: fast, zero-cost local inference for private triage on the device in your hand, paired with optional PII-redacted cloud synthesis when deeper multi-document reasoning is needed.

### What It Does
**FieldScribe Local** turns unstructured field notes into structured triage checklists, urgency flags, vitals summaries, and accessibility accommodations (wheelchair/ramp access, ASL interpretation, large-print/screen-reader packets, sensory-quiet rooms):
1. **Local-First Execution (`0 B Cloud Egress`)**: Uses `InferenceMode.PREFER_ON_DEVICE` and `InferenceMode.ONLY_ON_DEVICE` to run on Chrome's built-in Gemini Nano (`LanguageModel` API) on Web, Apple `FoundationModels` on iOS, or a deterministic local fallback engine when offline.
2. **Client-Side PII Airlock**: Before any prompt is allowed to escalate to cloud Gemini models via Firebase AI Logic, an on-device scrubber masks SSNs, phone numbers, emails, DOBs, and record IDs (`[REDACTED-*]`), displaying a live byte-exact egress receipt in the top bar.
3. **One-Tap Airplane Mode Verification**: Judges can toggle Offline Mode directly inside the live Web studio and verify sub-millisecond structured triage with zero network calls.

### How We Built It (Web + Native iOS Multi-Platform)
- **Web PWA (`web/`)**: ES module architecture (`hybrid-router.mjs`) integrating `firebase/ai` (`getAI`, `GoogleAIBackend`, `getGenerativeModel`, `InferenceMode.PREFER_ON_DEVICE`) alongside direct W3C `LanguageModel` capability probing, wrapped in a zero-scroll `100dvh` responsive interface tested across mobile, tablet, and desktop viewports.
- **Native iOS (`ios/`)**: Swift 6 package (`FieldScribeKit` + `FieldScribeApp`) pairing actor-isolated PII scrubbing with Apple `FoundationModels` and `FirebaseAILogic` protected by `FirebaseAppCheck` (`AppAttestProvider`).
- **Automated Verification**: Node `node:test` and `XCTest` suites verifying PII scrubbing, `0-byte` offline egress, and hybrid fallback transitions.

### Challenges We Ran Into
Not every judge's browser has finished downloading multi-gigabyte on-device Gemini Nano weights before opening a live demo URL. We engineered a seamless three-tier cascade (Gemini Nano on-device -> deterministic local structured extractor -> opt-in PII-redacted Firebase AI Logic cloud model) so the app works instantaneously on the very first click with zero setup friction.

### Accomplishments That We're Proud Of
- True cross-platform architecture spanning both **Web** and **Swift 6 / SwiftUI iOS**.
- Verifiable byte-level privacy telemetry (`0 B Cloud Egress` in local modes; redacted-only byte count in hybrid synthesis mode).
- Clean, accessible interface passing strict contrast, keyboard focus, touch-target (`>= 44px`), and zero-overflow checks across 5 viewport sizes.

### What's Next for FieldScribe Local
Adding offline WebGPU Whisper voice dictation and HL7 FHIR / assistive-accommodation PDF export for nonprofit clinics.

### Built With
`firebase`, `firebase-ai-logic`, `gemini-nano`, `gemini`, `typescript`, `javascript`, `swift`, `swiftui`, `apple-foundation-models`

### Transparency & Tooling Disclosure
Developed by Justin Aharoni (`@jaharoni`) during the `#BuildHybridAI 2026` submission period using AI-assisted software engineering and automated verification tooling. Released under the MIT License.
