# FocusGuard — Study & App Restriction Platform

FocusGuard is a starter full-stack project for study protection:
- Exam scheduling
- Focus sessions / Pomodoro
- Study tasks and daily progress
- Instagram/social-app restriction plans
- One-time unlock codes (OTP)
- Weekly reports
- Android companion architecture for real device-level app blocking

## Important technical limitation
A normal website cannot directly prevent Android apps such as Instagram from opening.
The web app manages the policy; the Android companion app enforces it using Android's
AccessibilityService. The included Android project is a working starter that shows the
blocked-app screen and can be extended for production hardening.

## Stack
- Backend: Node.js + Express + SQLite
- Frontend: vanilla HTML/CSS/JS
- Android: Kotlin + Android AccessibilityService
- Authentication: simple local JWT-style session for demo purposes

## Run the web app

Requirements: Node.js 20+

```bash
cd server
npm install
npm start
```

Open http://localhost:3000

Demo account:
- username: demo
- password: demo1234

## Project structure

server/
  src/
    server.js
    db.js
  public/
    index.html
    app.js
    style.css
  data/
android/
  FocusGuardAndroid/
    settings.gradle.kts
    build.gradle.kts
    app/
      build.gradle.kts
      src/main/AndroidManifest.xml
      src/main/java/com/focusguard/app/MainActivity.kt
      src/main/java/com/focusguard/app/FocusAccessibilityService.kt
      src/main/res/xml/accessibility_service_config.xml
      src/main/res/layout/activity_main.xml

## Production checklist
Before publishing:
1. Replace demo authentication with secure password hashing + refresh tokens.
2. Put the API behind HTTPS.
3. Use secure random OTP generation and server-side expiry.
4. Bind device sessions to a signed device key.
5. Add rate limiting and audit logging.
6. Add explicit consent and transparent controls for app blocking.
7. Test Android accessibility behavior across Android versions.
8. Do not claim that a web page alone can lock other apps.


## GitHub upload structure

Upload the **contents of this ZIP** to the repository root. Do not flatten the folders.
The GitHub root should contain:
- `server/`
- `android/`
- `docs/`
- `README.md`
- `.gitignore`

After upload, `server/package.json` must be visible at `server/package.json` (not at the repository root).

## Android build note

The starter Android app uses the platform `Activity` class for the launcher activity, so it does not require AppCompat just to compile this starter project.
