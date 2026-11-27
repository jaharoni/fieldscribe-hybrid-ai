# Devpost Submission Packet: `#BuildHybridAI 2026`

- **Event URL**: https://firebasehybridaihackathon.devpost.com/
- **Project Title**: `FieldScribe Local`
- **Tagline**: Privacy-first hybrid on-device + cloud clinical and accessibility field-intake studio across Web & Swift 6 iOS (`0 bytes` raw PII cloud egress).
- **Try It Out Live URL**: https://jaharoni.github.io/fieldscribe-hybrid-ai/
- **Unlisted Demo Video URL**: https://youtu.be/WkAfq2tS6_E
- **Public GitHub Repository**: https://github.com/jaharoni/fieldscribe-hybrid-ai

---

## Copy-Paste Devpost Description (Mapped 1:1 to Judging Rubric)

### Inspiration
Community health workers, home-visit nurses, and accessibility coordinators constantly record sensitive intake notes in rural homes, hospital basements, and transit corridors where connectivity drops without warning and sending raw personal identifiers (SSNs, MRNs, dates of birth, phone numbers) to cloud endpoints is unacceptable. Hybrid AI solves both constraints together: fast, zero-cost local inference on the device in your hand when offline or handling raw identifiers, paired with PII-redacted Gemini cloud synthesis when deeper clinical formatting is needed.

### What It Does
**FieldScribe Local** transforms unstructured voice or typed field notes into structured triage plans, urgency classifications, vital-sign observations, and accessibility accommodations (step-free wheelchair access, certified ASL interpretation, high-contrast large-print packets, low-stimulation sensory rooms):
1. **Local-First Execution (`0 B Cloud Egress`)**: Uses `InferenceMode.PREFER_ON_DEVICE` and `InferenceMode.ONLY_ON_DEVICE` to run on Chrome's built-in Gemini Nano (`LanguageModel` API) on Web, Apple's `FoundationModels` (`LanguageModelSession`) on iOS, or a deterministic local clinical engine when offline.
2. **Dual Client + Edge PII Airlock**: Before any note escalates to `HYBRID_CLOUD_SYNTHESIS`, an on-device scrubber masks SSNs, medical/case IDs, dates of birth, phone numbers, and emails into color-coded tokens (`[REDACTED-*]`), displaying a live byte-exact egress receipt in the top bar. Judges can test live **Gemini 3.1 Flash Lite** cloud synthesis in one click with zero API key setup via our origin-locked edge gateway, which also enforces server-side raw-SSN rejection.
3. **Interoperable HL7 FHIR R4 Export & Voice Dictation**: Includes live on-device voice dictation with a 60fps waveform monitor, Daylight / Night Shift themes for dim hospital corridors, one-tap Airplane Mode verification, and one-click export to **HL7 FHIR R4 Bundle JSON** (`Communication`, `Flag`, and `Observation` resources) or **Care Handoff Markdown**.

### How We Built It (Web + Native Swift 6 iOS Multi-Platform)
- **Web PWA (`web/`)**: Zero-dependency ES module architecture (`hybrid-router.mjs`) integrating `firebase/ai` (`getAI`, `GoogleAIBackend`, `getGenerativeModel`, `InferenceMode.PREFER_ON_DEVICE`) alongside direct W3C `LanguageModel` capability probing and an origin-locked Cloudflare Worker gateway (`gemini-3.1-flash-lite`), wrapped in a `100dvh` zero-scroll responsive interface verified across 5 mobile, tablet, and desktop viewports.
- **Native Swift 6 iOS (`ios/`)**: Actor-isolated `FieldScribeKit` + `FieldScribeApp` pairing Apple `FoundationModels` (`#if canImport(FoundationModels)`) with `FirebaseAILogic` + `FirebaseAppCheck` (`AppAttestProvider`), Siri / Action Button `AppIntents`, a Lock Screen `WidgetKit` extension, and a multi-layer `.icon` bundle.
- **Automated Verification**: Node `node:test` and `XCTest` suites verifying 5-category PII masking, `0-byte` offline guarantees, live hybrid cloud routing, and valid HL7 FHIR R4 Bundle generation.

### Challenges We Ran Into
Not every judge's browser has pre-downloaded multi-gigabyte Gemini Nano weights or configured a personal Firebase project before opening a hackathon demo URL. We engineered a seamless three-tier cascade (on-device Gemini Nano -> sub-millisecond deterministic local clinical engine -> zero-setup PII-redacted Gemini 3.1 Flash Lite gateway + optional custom Firebase AI Logic project keys) so every mode works instantaneously on the very first click.

### Accomplishments That We're Proud Of
- True multi-platform architecture spanning **Web PWA** and **Native Swift 6 / SwiftUI iOS** (`FoundationModels`, `WidgetKit`, `AppIntents`).
- Verifiable byte-level privacy telemetry (`0 B Cloud Egress` locally; ~200 B redacted-only payload in hybrid cloud mode).
- Clinical interoperability out of the box via **HL7 FHIR R4 Bundle JSON** export alongside human-readable Care Handoff Markdown.

### What's Next for FieldScribe Local
Adding offline WebGPU Whisper multilingual speech transcription for Spanish, Mandarin, and Arabic home visits, plus direct SMART-on-FHIR EHR sandbox sync for community health nonprofits.

### Built With
`firebase`, `firebase-ai-logic`, `gemini-nano`, `gemini`, `javascript`, `swift`, `swiftui`, `apple-foundation-models`, `hl7-fhir`, `cloudflare-workers`

### Transparency & Tooling Disclosure
Developed by Justin Aharoni (`@jaharoni`) during the `#BuildHybridAI 2026` submission period using AI-assisted software engineering and automated verification tooling. Released under the MIT License.
