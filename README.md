# FieldScribe Local — Privacy-First Hybrid On-Device & Cloud Intake Studio

Built for **#BuildHybridAI 2026** across **Web (PWA)** and **Native iOS (Swift 6 / SwiftUI)** using the **Firebase AI Logic Hybrid Inference SDK** (`InferenceMode.PREFER_ON_DEVICE`, `InferenceMode.ONLY_ON_DEVICE`, and PII-redacted `InferenceMode.PREFER_IN_CLOUD`).

## Why FieldScribe Local Exists
Community health workers, home-care nurses, disaster-relief volunteers, and accessibility coordinators routinely capture sensitive intake notes in basements, rural clinics, and transit zones where:
1. Connectivity drops unpredictably, and
2. Uploading raw unredacted personal identifiers (SSNs, MRNs, dates of birth, phone numbers) to cloud LLMs is unsafe.

**FieldScribe Local** processes sensitive field notes **on-device first at `0 bytes` cloud egress** (using Chrome's built-in Gemini Nano W3C `LanguageModel` API on Web and Apple's `FoundationModels` framework on iOS, backed by a deterministic local fallback engine), and automatically masks direct PII on-device before any opt-in Firebase AI Logic cloud synthesis occurs.

---

## Multi-Platform Architecture
- **`web/` (Zero-Scroll `100dvh` Web Studio)**:
  - `hybrid-router.mjs`: Implements `runHybridIntakeSession`, `redactSensitiveIdentifiers`, W3C `LanguageModel` probing, and `createFirebaseAiCloudAdapter` (`firebase/ai` `getAI`, `GoogleAIBackend`, `getGenerativeModel`, `InferenceMode.PREFER_ON_DEVICE`).
  - `index.html`: Accessible, responsive 3-pane workspace with live `0 B Cloud Egress` audit meter and one-tap Offline / Airplane Mode testing.
- **`ios/` (Swift 6 Package for iOS 18+ / iOS 26 FoundationModels)**:
  - `Sources/FieldScribeKit/FieldScribeHybridCoordinator.swift`: Actor-isolated coordinator bridging on-device `FoundationModels` + `FirebaseAILogic` + `FirebaseAppCheck` (`AppAttestProvider`).
  - `Sources/FieldScribeApp/FieldScribeRootView.swift`: VoiceOver-ready SwiftUI companion interface.

---

## Quick Start & Automated Verification

```bash
cd web
npm test
npx serve . -l 4173
```

### Privacy & Security By Design
- Zero API keys are hardcoded in source (`.env.example` documents optional client config).
- Strictly `0 bytes` of network egress in `ONLY_ON_DEVICE` and offline `PREFER_ON_DEVICE` modes.
- Client-side regex scrubbing strips SSNs, phone numbers, email addresses, DOBs, and medical/case record numbers prior to any opt-in cloud fallback.

## License
MIT License — Copyright (c) 2026 Justin Aharoni.
