# lib/ Layering Guidelines

This folder is transitioning toward a simple layered architecture:

- `domain/`: Pure domain logic and types. No I/O, no framework, no database.
- `app/`: Use cases and orchestration. Coordinates domain + infra.
- `infra/`: External systems (DB, queues, email, logging, network calls).

Existing modules remain in `src/lib` for backward compatibility. New code should
prefer the layered folders and re-export through shims where needed.
