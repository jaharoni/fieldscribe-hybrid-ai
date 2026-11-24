#if canImport(SwiftUI)
import SwiftUI
import FieldScribeKit

public struct FieldScribeRootView: View {
    @State private var noteText: String = ""
    @State private var policy: FieldScribeInferencePolicy = .preferOnDevice
    @State private var intake: StructuredFieldIntake?
    @State private var receipt: HybridTelemetryReceipt?

    private let coordinator = FieldScribeHybridCoordinator()

    public init() {}

    public var body: some View {
        NavigationStack {
            Form {
                Section("Firebase AI Logic Policy") {
                    Picker("Inference Mode", selection: $policy) {
                        Text("Prefer On-Device").tag(FieldScribeInferencePolicy.preferOnDevice)
                        Text("Strictly On-Device (0 B Cloud)").tag(FieldScribeInferencePolicy.onlyOnDevice)
                        Text("Hybrid Cloud (PII Redacted)").tag(FieldScribeInferencePolicy.hybridCloudRedacted)
                    }
                }

                Section("Raw Field & Accessibility Note") {
                    TextEditor(text: $noteText)
                        .frame(minHeight: 140)
                        .accessibilityLabel("Raw field intake note")

                    Button("Extract Structured Triage Plan") {
                        Task {
                            if let res = try? await coordinator.evaluateIntake(
                                rawText: noteText,
                                policy: policy,
                                isOnline: policy != .onlyOnDevice
                            ) {
                                intake = res.0
                                receipt = res.1
                            }
                        }
                    }
                }

                if let receipt, let intake {
                    Section("Privacy & Routing Receipt") {
                        LabeledContent("Route", value: receipt.route)
                        LabeledContent("Cloud Bytes Sent", value: "\(receipt.cloudBytesSent) B")
                        LabeledContent("PII Identifiers Redacted", value: "\(receipt.piiRedactedCount)")
                    }

                    Section("Structured Action Plan (\(intake.urgency.uppercased()))") {
                        Text(intake.summary)
                        ForEach(intake.accommodations, id: \.self) { item in
                            Label(item, systemImage: "checkmark.shield")
                        }
                    }
                }
            }
            .navigationTitle("FieldScribe Local")
        }
    }
}
#endif
