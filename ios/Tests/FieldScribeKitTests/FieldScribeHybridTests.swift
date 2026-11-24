import XCTest
@testable import FieldScribeKit

final class FieldScribeHybridTests: XCTestCase {
    func testRedactionStripsIdentifiersBeforeCloudFallback() async throws {
        let coordinator = FieldScribeHybridCoordinator()
        let sample = "MRN: ZX-19920, SSN 123-45-6789, call (206) 555-0144. Client needs wheelchair ramp."
        let (sanitized, count) = coordinator.redactSensitiveIdentifiers(sample)

        XCTAssertEqual(count, 3)
        XCTAssertFalse(sanitized.contains("123-45-6789"))
        XCTAssertFalse(sanitized.contains("555-0144"))
        XCTAssertFalse(sanitized.contains("ZX-19920"))
    }

    func testOnlyOnDeviceGuaranteesZeroCloudBytes() async throws {
        let coordinator = FieldScribeHybridCoordinator()
        let (intake, receipt) = try await coordinator.evaluateIntake(
            rawText: "Deaf patient needs urgent ASL interpreter.",
            policy: .onlyOnDevice,
            isOnline: true
        )
        XCTAssertEqual(receipt.cloudBytesSent, 0)
        XCTAssertTrue(receipt.offlineSafe)
        XCTAssertEqual(intake.urgency, "urgent")
    }
}
