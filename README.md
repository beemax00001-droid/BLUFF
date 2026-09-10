# FocusGuard — Study & App Restriction Platform

FocusGuard is a starter full-stack study-protection platform with a web dashboard and an Android companion app.

## Included
- Exam scheduling
- Focus/Pomodoro sessions
- Study tasks and daily progress
- App restriction plans
- One-time unlock codes (demo mode)
- Weekly reports
- Android AccessibilityService starter for foreground-app blocking

## Important limitation
A normal website cannot directly block another Android app. The web dashboard stores the study policy; the Android companion app enforces local blocking. The starter currently demonstrates the enforcement flow for Instagram and is intentionally a development starter, not a production parental-control/security product.

## Project tree
```text
.
├── .github/workflows/android-build.yml
├── android/FocusGuardAndroid/
├── docs/ARCHITECTURE.md
├── server/
│   ├── package.json
│   ├── src/
│   └── public/
├── .gitignore
├── gradle.properties
└── README.md
```

## Web app
Requirements: Node.js 20+

```bash
cd server
npm install
npm start
```

Then open `http://localhost:3000`.

Demo account:
- username: `demo`
- password: `demo1234`

The demo OTP endpoint returns a `demoCode` so local testing is easy. Do not use that behavior in production.

## Android app
Open `android/FocusGuardAndroid` as an Android Studio project. The project uses:
- compileSdk 35
- targetSdk 35
- minSdk 26
- Kotlin 2.0.21
- Android Gradle Plugin 8.7.3

After installing the debug APK, enable **Settings → Accessibility → FocusGuard**. When Instagram becomes the foreground app, the starter service opens the FocusGuard blocked screen.

The Android starter intentionally keeps policy storage simple. A production implementation should authenticate the device, download signed policies, validate time windows securely, and add a proper unlock flow.

## GitHub upload
Upload the **contents of this ZIP**, not the ZIP file itself, to the repository root. Do not flatten folders.

The repository root must show:
```text
android/
docs/
server/
.github/
README.md
.gitignore
gradle.properties
```

And `server/package.json` must be located at exactly:
```text
server/package.json
```

## GitHub Android build
The included GitHub Actions workflow builds the Android debug APK on a manual run or when Android files change. After pushing the repository, open **Actions → Android build → Run workflow**. The generated APK is uploaded as an Actions artifact named `focusguard-debug-apk`.

## Production checklist
Before publishing:
- Replace demo plaintext passwords with secure password hashing.
- Use HTTPS and secure secrets.
- Deliver OTPs through a trusted channel; never return OTPs from the API.
- Add rate limiting, audit logging, device authentication, and policy signatures.
- Validate restriction time windows on-device.
- Add explicit user consent and transparent controls.
- Test AccessibilityService behavior on supported Android versions.
