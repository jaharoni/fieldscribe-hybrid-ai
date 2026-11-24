#if canImport(AppIntents)
import AppIntents
import FieldScribeKit

/// Action Button & Siri Shortcuts Offline Field Note Triage Intent (0 B Cloud Egress).
@available(iOS 18.0, macOS 15.0, *)
public struct CaptureOfflineFieldNoteIntent: AppIntent {
    public static let title: LocalizedStringResource = "Triage Field Note Offline"
    public static let description = IntentDescription("Extracts urgency and accessibility accommodations strictly on-device with zero cloud bytes.")

    @Parameter(title: "Field Note")
    public var rawNote: String

    public init() {}

    public func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let coordinator = FieldScribeHybridCoordinator()
        let (intake, receipt) = try await coordinator.evaluateIntake(
            rawText: rawNote,
            policy: .onlyOnDevice,
            isOnline: false
        )
        let line = "[\(intake.urgency.uppercased()) | \(receipt.cloudBytesSent)B Cloud] \(intake.summary)"
        return .result(value: line)
    }
}
#endif
