# Security policy

SparFlow is a local-first savings app. Savings goals, contributions, challenges and preferences are stored in the app's local SQLite database. The application does not require an account, remote database or analytics service for its core functions.

## Release gates

Every release build must pass:

- Expo dependency compatibility checks
- npm audit for high and critical production dependency advisories
- Expo Doctor project diagnostics
- TypeScript type checking
- a clean Expo iOS prebuild
- CocoaPods installation
- a Release-mode Xcode device build
- IPA packaging before the SideStore source is updated

## Secrets

Do not commit certificates, provisioning profiles, private keys, environment files or signing credentials. Generated iOS and Android projects are excluded from the repository.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting / Security Advisory feature for this repository when available. Do not publish credentials, private financial data or exploit details in a public issue.
