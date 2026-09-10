# Architecture

```text
                 ┌─────────────────────┐
                 │   FocusGuard Web    │
                 │ Dashboard / Plans   │
                 └──────────┬──────────┘
                            │ HTTPS REST API
                            ▼
                 ┌─────────────────────┐
                 │ Node + Express API  │
                 │ OTP / Exams / Tasks  │
                 └──────────┬──────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    SQLite    │
                    └──────────────┘

                 Android Companion
                            │
                    AccessibilityService
                            │
                            ▼
                    Instagram / Apps
```

## Core entities
- User
- Exam
- Task
- Restriction
- OTP
- StudySession

## Recommended production upgrades
- PostgreSQL instead of SQLite
- Argon2id password hashing
- Short-lived access tokens + refresh tokens
- Device registration with asymmetric keys
- Server-time validation
- Push notifications
- Background sync
- Signed restriction policies
- Android foreground service only where appropriate
- Local encrypted policy cache
- Audit log for cancellation/unlock
- Admin/support tools
