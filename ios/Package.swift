// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "FieldScribeLocal",
    platforms: [
        .iOS(.v18),
        .macOS(.v15)
    ],
    products: [
        .library(name: "FieldScribeKit", targets: ["FieldScribeKit"]),
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "11.6.0")
    ],
    targets: [
        .target(
            name: "FieldScribeKit",
            dependencies: [
                .product(name: "FirebaseAILogic", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAppCheck", package: "firebase-ios-sdk")
            ]
        ),
        .testTarget(
            name: "FieldScribeKitTests",
            dependencies: ["FieldScribeKit"]
        )
    ]
)
