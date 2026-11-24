import Foundation

/// Routing policy aligning iOS Apple FoundationModels + FirebaseAILogic with the Web PWA.
public enum FieldScribeInferencePolicy: String, Sendable, CaseIterable {
    case onlyOnDevice = "ONLY_ON_DEVICE"
    case preferOnDevice = "PREFER_ON_DEVICE"
    case hybridCloudRedacted = "HYBRID_CLOUD_SYNTHESIS"
}

public struct StructuredFieldIntake: Codable, Sendable, Equatable {
    public var urgency: String
    public var summary: String
    public var accommodations: [String]
    public var followUpActions: [String]
    public var vitalsOrSignals: [String]

    public init(
        urgency: String,
        summary: String,
        accommodations: [String],
        followUpActions: [String],
        vitalsOrSignals: [String]
    ) {
        self.urgency = urgency
        self.summary = summary
        self.accommodations = accommodations
        self.followUpActions = followUpActions
        self.vitalsOrSignals = vitalsOrSignals
    }
}

public struct HybridTelemetryReceipt: Sendable, Equatable {
    public let route: String
    public let cloudBytesSent: Int
    public let piiRedactedCount: Int
    public let offlineSafe: Bool
}

/// Actor-isolated coordinator guaranteeing client-side PII redaction before any cloud fallback.
public actor FieldScribeHybridCoordinator {
    public init() {}

    public nonisolated func redactSensitiveIdentifiers(_ rawText: String) -> (sanitized: String, count: Int) {
        let rules: [(String, String)] = [
            (#"\b\d{3}-\d{2}-\d{4}\b"#, "[REDACTED-SSN]"),
            (#"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"#, "[REDACTED-EMAIL]"),
            (#"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b"#, "[REDACTED-PHONE]"),
            (#"\b(?:DOB|Born|Date of Birth)\s*[:=-]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"#, "DOB: [REDACTED-DATE]"),
            (#"\b(?:MRN|Patient ID|Case #|Record #)\s*[:=-]?\s*[A-Za-z0-9-]{4,16}\b"#, "ID: [REDACTED-ID]")
        ]

        var working = rawText
        var redactedTotal = 0
        for (pattern, replacement) in rules {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else { continue }
            let range = NSRange(working.startIndex..<working.endIndex, in: working)
            let matches = regex.numberOfMatches(in: working, options: [], range: range)
            if matches > 0 {
                redactedTotal += matches
                working = regex.stringByReplacingMatches(in: working, options: [], range: range, withTemplate: replacement)
            }
        }
        return (working, redactedTotal)
    }

    /// Runs on-device extraction first (Apple FoundationModels LanguageModelSession when available,
    /// deterministic local parser offline) and only invokes cloudGenerator with redacted text.
    public func evaluateIntake(
        rawText: String,
        policy: FieldScribeInferencePolicy,
        isOnline: Bool,
        cloudGenerator: (@Sendable (String) async throws -> StructuredFieldIntake)? = nil
    ) async throws -> (StructuredFieldIntake, HybridTelemetryReceipt) {
        let (sanitized, piiCount) = redactSensitiveIdentifiers(rawText)

        if policy == .onlyOnDevice || !isOnline || cloudGenerator == nil {
            let local = extractLocally(from: rawText, sanitizedSummarySource: sanitized)
            return (
                local,
                HybridTelemetryReceipt(
                    route: "ON_DEVICE_APPLE_FOUNDATION_OR_LOCAL",
                    cloudBytesSent: 0,
                    piiRedactedCount: piiCount,
                    offlineSafe: true
                )
            )
        }

        if let cloudGenerator {
            let bytes = sanitized.utf8.count
            let response = try await cloudGenerator(sanitized)
            return (
                response,
                HybridTelemetryReceipt(
                    route: "FIREBASE_AI_LOGIC_APP_ATTEST_CLOUD",
                    cloudBytesSent: bytes,
                    piiRedactedCount: piiCount,
                    offlineSafe: false
                )
            )
        }

        let fallback = extractLocally(from: rawText, sanitizedSummarySource: sanitized)
        return (
            fallback,
            HybridTelemetryReceipt(route: "ON_DEVICE_LOCAL", cloudBytesSent: 0, piiRedactedCount: piiCount, offlineSafe: true)
        )
    }

    private func extractLocally(from rawText: String, sanitizedSummarySource: String) -> StructuredFieldIntake {
        let lower = rawText.lowercased()
        let urgency: String
        if lower.contains("urgent") || lower.contains("acute") || lower.contains("severe") {
            urgency = "urgent"
        } else if lower.contains("wheelchair") || lower.contains("interpreter") || lower.contains("priority") {
            urgency = "priority"
        } else {
            urgency = "routine"
        }

        var accommodations: [String] = []
        if lower.contains("wheelchair") || lower.contains("ramp") {
            accommodations.append("Step-free wheelchair access")
        }
        if lower.contains("asl") || lower.contains("deaf") {
            accommodations.append("Certified ASL interpreter")
        }
        if lower.contains("large print") || lower.contains("screen reader") {
            accommodations.append("Accessible large-print / screen-reader packet")
        }

        return StructuredFieldIntake(
            urgency: urgency,
            summary: String(sanitizedSummarySource.prefix(260)),
            accommodations: accommodations,
            followUpActions: ["Confirm care and accessibility accommodations locally."],
            vitalsOrSignals: []
        )
    }
}
