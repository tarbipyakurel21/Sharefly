# Lightweight modular architecture

The application will be one deployable service with provider adapters, not a fleet of microservices.

```text
UI -> application service -> domain workflows/agents
                         -> provider interfaces
                            -> Gemini | database | deployment | optional sponsor APIs
                         -> evidence/audit log
```

Proposed boundaries: `frontend/` for the demo UI; `backend/services/` for use cases; `backend/agents/` for bounded workflows; `backend/integrations/<provider>/` for adapters; `tests/` for contract and end-to-end tests. Each provider exposes an interface and mock implementation. Configuration selects enabled providers through environment variables. The core workflow must work with mocks and degrade gracefully when credentials or network access are absent.

No application modules should be created until the idea and sponsor strategy are approved.

