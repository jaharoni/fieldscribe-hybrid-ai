#if canImport(WidgetKit) && canImport(SwiftUI)
import WidgetKit
import SwiftUI

public struct FieldScribeWidgetEntry: TimelineEntry {
    public let date: Date
    public let statusLabel: String
    public let cloudBytesSent: Int
}

/// Lightweight (< 30 MB Jetsam ceiling) Lock-Screen & Home-Screen Quick Intake Widget.
@available(iOS 18.0, macOS 15.0, *)
public struct FieldScribeQuickIntakeWidgetView: View {
    public var entry: FieldScribeWidgetEntry

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "checkmark.shield.fill")
                Text("FieldScribe Local")
                    .font(.caption.weight(.bold))
            }
            Text(entry.statusLabel)
                .font(.footnote.weight(.semibold))
            Text("\(entry.cloudBytesSent) B Cloud Egress")
                .font(.caption2.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .padding(12)
    }
}
#endif
