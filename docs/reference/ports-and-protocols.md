# Ports and protocols

| Component | Default bind/target | Protocol | Evidence |
|---|---|---|---|
| Web | `3000` (Next conventional command) | HTTP | `package.json`; actual port configurable by Next runtime, not source config |
| Gateway | `0.0.0.0:8000` | HTTP | gateway `internal/config/config.go:108-110`, `cmd/server/main.go:45` |
| Identity HTTP | `0.0.0.0:8080` | HTTP | identity config/main |
| Identity gRPC | `:50051` | gRPC over plaintext in shown code | identity `cmd/server/main.go:135-150` |
| Academic HTTP | `0.0.0.0:8081` | HTTP | academic config/main |
| Billing HTTP | `0.0.0.0:8082` | HTTP | billing config/main |
| PostgreSQL | `localhost:5432` | PostgreSQL | each stateful service config default |
| Redis | `localhost:6379` | Redis; optional TLS config | identity/gateway config/main |

External provider URLs are configuration values. Billing defaults the Duitku base URL to its sandbox API; Google Maps and Resend code use HTTPS endpoints. Deployment network routing and TLS termination are **Unknown**.
