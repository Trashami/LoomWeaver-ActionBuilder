# Backend-specific instructions (.NET 10)

Follow the root `../AGENTS.md`, `../docs/architecture/repository-layout.md`, and `../docs/architecture/engine-placement-and-ownership.md`.

- Organize code by module and vertical feature slice (`LoomWeaver.Domain`, `LoomWeaver.GameSystems`, `LoomWeaver.Infrastructure`, `LoomWeaver.Modules`, `LoomWeaver.Api`).
- Connect exclusively to the `loomweaver` MySQL schema and `loomweaver` Neo4j graph namespace (never `jane` or `jane_scrum`).
- Enforce role and visibility filtering (`gm`, `players`, `public`) on the server before returning any DTO, graph neighborhood, or Loom citation.
- Keep hand-written `.cs` files focused (100–300 lines target, 500 lines max).
- Do not put business rules or database queries inside `Program.cs`; register modules cleanly via extension methods.
