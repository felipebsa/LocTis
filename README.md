# LOCTIS

🚧 **Status: In Development** — not production-ready yet

Multi-tenant SaaS backend for landlords to manage rental properties, contracts, and clients in one place, with isolated workspaces per landlord and built-in financial tracking.

---

## About

LOCTIS is a backend API built to manage the day-to-day operations of rental property management (residential and commercial: apartments, houses, warehouses). Each landlord (locador) has an isolated workspace — their properties, contracts, and clients are never visible to other landlords on the same platform (multi-tenancy).

The project is being built backend-first, with a strong focus on production-grade practices: versioned database migrations, containerization, and automated testing — areas the author had not worked with before this project. A frontend is planned for a later phase, once the backend is complete.

**Development notes:** architecture, data modeling, and all implementation decisions are made independently. AI assistance (Claude) is used specifically for syntax clarification and debugging support, not for design or planning.

---

## Planned Features

- [ ] JWT Authentication
- [ ] Multi-tenant data isolation (automatic scoping by landlord)
- [ ] Property (Imovel) management — simple and advanced records (custom fields via JSONB)
- [ ] Client management
- [ ] Contract management (dates, values, linked property/client)
- [ ] Pagination on list endpoints
- [ ] Database migrations with Alembic
- [ ] Automated tests with pytest
- [ ] Dockerized environment (API + PostgreSQL via docker-compose)

*Planned for a later phase: notes per record, financial dashboard, payment calendar, contract PDF storage, beginner-friendly explanations of rental fees/terms.*

---

## Project Structure

```
(to be defined)
```

---

## Installation (local development)

**Requirements:** Python 3.8+, PostgreSQL, Docker

```bash
# Clone the repository
git clone https://github.com/felipebsa/loctis.git
cd loctis

# (setup instructions to be added once the base structure is defined)
```

---

## Planned Data Models

### Locador
The account owner — represents a landlord using the platform. All tenant-scoped data (properties, clients, contracts) belongs to a Locador via foreign key.

### Imovel
A rental property (residential or commercial). Core typed fields (e.g. type, condo fee) plus an `extra_data` (JSONB) field for advanced/custom details defined per landlord.

### Cliente
A tenant/renter linked to a Locador.

### Contrato
Links a Locador, Cliente, and Imovel together, with contract dates and value.

---

## Tech Stack

**Backend**
- [Python 3](https://python.org)
- [FastAPI](https://fastapi.tiangolo.com)
- [SQLAlchemy 2.0](https://sqlalchemy.org)
- [Pydantic](https://docs.pydantic.dev)
- [PostgreSQL](https://postgresql.org)
- [Alembic](https://alembic.sqlalchemy.org)
- [pytest](https://pytest.org)
- [Uvicorn](https://www.uvicorn.org)

**Infrastructure**
- [Docker](https://www.docker.com) / docker-compose

---

## Status

🚧 **In development.** Currently in the planning/setup phase — project structure, base models, authentication, and multi-tenancy are being designed and implemented first, followed by migrations, containerization, and tests.