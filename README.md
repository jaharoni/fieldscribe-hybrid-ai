# FieldScribe Local: Privacy-First Hybrid On-Device & Cloud Intake Studio

Built for **#BuildHybridAI 2026** across **Web (PWA)** and **Native iOS (Swift 6 / SwiftUI)** using the **Firebase AI Logic Hybrid Inference SDK** (`InferenceMode.PREFER_ON_DEVICE`, `InferenceMode.ONLY_ON_DEVICE`, and PII-redacted `InferenceMode.PREFER_IN_CLOUD`).

- **Live Zero-Setup Web Studio**: https://jaharoni.github.io/fieldscribe-hybrid-ai/
- **Source Repository**: https://github.com/jaharoni/fieldscribe-hybrid-ai

## Why FieldScribe Local Exists
Community health workers, home-care nurses, disaster-relief volunteers, and accessibility coordinators routinely capture sensitive intake notes in basements, rural clinics, and transit zones where:
1. Connectivity drops unpredictably, and
2. Uploading raw unredacted personal identifiers (SSNs, MRNs, dates of birth, phone numbers, email addresses) to cloud LLMs is unsafe.

**FieldScribe Local** processes sensitive field notes **on-device first at `0 bytes` cloud egress** (using Chrome's built-in Gemini Nano W3C `LanguageModel` API on Web and Apple's iOS 26 `FoundationModels` framework on iPhone/iPad, backed by a deterministic local clinical engine), and automatically masks direct PII on-device before any opt-in Gemini cloud synthesis occurs.

---

## Multi-Platform Architecture

### 1. Web PWA Studio (`web/`)
- **`hybrid-router.mjs`**: Implements `runHybridIntakeSession`, `redactSensitiveIdentifiers` (with per-category token accounting), W3C `LanguageModel` probing, `buildFhirR4Bundle` (interoperable HL7 FHIR R4 `Communication`, `Flag`, and `Observation` resources), `buildAccessibleCareMarkdown`, `createServerlessGatewayAdapter` (zero-setup PII-airlocked Gemini 3.1 Flash Lite edge gateway), and `createFirebaseAiCloudAdapter` (`firebase/ai` `getAI`, `GoogleAIBackend`, `getGenerativeModel`, `InferenceMode.PREFER_ON_DEVICE`).
- **`index.html`**: Accessible, zero-scroll `100dvh` 3-pane clinical and accessibility workspace featuring:
  - Live **On-Device Voice Dictation** (`Web Speech API`) with a 60fps acoustic waveform monitor,
  - **Inline Color-Coded PII Token Shield** highlighting masked `[REDACTED-SSN]`, `ID: [REDACTED-ID]`, `DOB: [REDACTED-DATE]`, `[REDACTED-PHONE]`, and `[REDACTED-EMAIL]` spans in real time,
  - **One-Click Hybrid Cloud Synthesis** out of the box via an origin-locked serverless Gemini 3.1 Flash Lite proxy that rejects unredacted SSNs at the edge (`HTTP 400`),
  - **One-Tap Airplane Mode Toggle** verifying sub-millisecond `0 B Cloud Egress` local extraction,
  - **HL7 FHIR R4 Bundle (`.json`) Export** and **Care Handoff Markdown** clipboard copy,
  - **Daylight Limestone & Night Shift Obsidian** dual-theme support.

### 2. Native Swift 6 iOS Companion (`ios/`)
- **`Sources/FieldScribeKit/FieldScribeHybridCoordinator.swift`**: Actor-isolated coordinator bridging iOS 26 `FoundationModels` (`SystemLanguageModel.default` + `LanguageModelSession`) with `FirebaseAILogic` + `FirebaseAppCheck` (`AppAttestProvider`) and native HL7 FHIR R4 export.
- **`Sources/FieldScribeApp/FieldScribeRootView.swift`**: VoiceOver-calibrated SwiftUI workspace.
- **`Sources/FieldScribeApp/CaptureOfflineFieldNoteIntent.swift` & `FieldScribeQuickIntakeWidget.swift`**: Siri / Action Button `AppIntents` shortcut and `< 30 MB` Lock Screen / Home Screen `WidgetKit` extension.
- **`FieldScribeLocal.icon/icon.json`**: Multi-layer Apple Icon Composer bundle.

---

## Quick Start & Automated Verification

```bash
node --test web/tests/hybrid-router.test.mjs
npx serve . -l 4173
```

### Privacy & Security By Design
- Zero API keys are hardcoded in source (`.env.example` documents optional client config; serverless gateway secrets stay encrypted at the edge).
- Strictly `0 bytes` of network egress in `ONLY_ON_DEVICE` and offline `PREFER_ON_DEVICE` modes.
- Client-side + edge-enforced PII airlock strips SSNs, phone numbers, email addresses, DOBs, and medical/case record numbers prior to any cloud inference.

## License
MIT License - Copyright (c) 2026 Justin Aharoni.
