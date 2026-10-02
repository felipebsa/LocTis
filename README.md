<p align="center">
  <img src=".github/assets/banner-logo.png" width="100%">
</p>

🚧 **Status:** In Development

Multi-tenant SaaS backend for landlords to manage rental properties, tenants, and contracts through a REST API.

---

## Overview

LOCTIS is a backend-first project for independent landlords and small property managers to manage properties, clients and contracts in one place.

Each landlord gets an isolated workspace — properties, clients and contracts never leak between accounts.

The first version is backend-only. Frontend comes after the API is stable.

---

## Goals

This project is my way of learning concepts used in real backend systems:

- Multi-tenant architecture
- JWT authentication
- Database migrations
- Automated testing
- Dockerized deployment
- Modular project structure

---

## Features

### Authentication

- [x] JWT Authentication
- [x] Password hashing
- [x] Protected routes
- [x] Landlord registration endpoint

### Property Management

- [x] Property CRUD (create, list all, get by ID, get by status, update PUT/PATCH, delete)
- [ ] Residential and commercial properties (custom fields)
- [x] Custom property fields (JSONB)

### Client Management

- [x] Client CRUD (create, list all, get by ID, update PUT, delete)

### Contract Management

- [x] Contract CRUD (create, list all, get by ID, get by status, update PUT/PATCH, delete)
- [x] Get contracts by property
- [x] Property ↔ Client relationship
- [x] Rental values and dates
- [x] Cross-tenant ownership validation on referenced Property/Client (FK ownership check)

### Service Management

- [x] Service CRUD (create, list all, get by ID, get by status, update PUT/PATCH, delete)
- [x] Get services by property
- [x] Get services by property and status

### Infrastructure

- [x] PostgreSQL
- [x] Alembic migrations
- [x] Docker / Docker Compose
- [x] Automated tests with pytest
- [ ] Pagination and filtering

### Future Features

- Financial dashboard
- Payment tracking
- Contract PDF storage
- Calendar view
- Notes per entity (generic polymorphic notes system)
- Rental terminology helper

---

## Domain Model

```
Landlord
│
├── Properties
├── Clients
├── Contracts
└── Services
```

### Landlord

The account owner. Every resource belongs to exactly one landlord — that's what keeps data isolated between users.

### Property

A residential or commercial property available for rent. Core fields are typed columns; extra/custom data goes in a JSONB field (`extra_data`).

### Client

A tenant linked to a landlord.

### Contract

The rental agreement connecting a landlord, a property and a client. Ownership of the referenced Property and Client is checked against the authenticated landlord on every write, so one landlord can't reference another's data.

### Service

A service (maintenance, repair, etc.) linked to a landlord and a property.

---

## Tech Stack

### Backend

- Python 3
- FastAPI
- SQLAlchemy 2.0
- Pydantic
- PostgreSQL
- Alembic
- Pytest
- Uvicorn

### Infrastructure

- Docker
- Docker Compose

---

## Project Structure

```
backend/
│
├── app/
│   ├── core/
│   │   ├── enums.py
│   │   ├── security.py
│   │   └── tenant.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── landlord.py
│   │   ├── property.py
│   │   ├── client.py
│   │   ├── contract.py
│   │   └── service.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── landlord.py
│   │   ├── property.py
│   │   ├── client.py
│   │   ├── contract.py
│   │   └── service.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── landlord.py
│   │   ├── property.py
│   │   ├── client.py
│   │   ├── contract.py
│   │   └── service.py
│   ├── database.py
│   └── main.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_auth.py
├── alembic/
├── alembic.ini
└── requirements.txt
```

---

## Local Development

### Requirements

- Python 3.12+
- Docker + Docker Compose

```bash
git clone https://github.com/felipebsa/loctis.git
cd loctis
```

Create a `.env` in the project root:

```
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=loctis
```

Create `backend/.env` with `SECRET_KEY`, `ALGORITHM`, `DATABASE_URL` and `TOKEN_EXPIRED`.

Then run:

```bash
docker compose up --build
docker compose exec api alembic upgrade head
```

API available at `http://localhost:8000/docs`.

---

## Manual Testing

Core flow and security-critical paths were manually verified end-to-end via Swagger UI (2026-08-15):

**Happy path**
- [x] Landlord registration → login → JWT issuance
- [x] Property creation, scoped to the authenticated landlord
- [x] Client creation, scoped to the authenticated landlord
- [x] Contract creation referencing a valid Property/Client owned by the landlord

**Security / risk scenarios**
- [x] Cross-tenant ownership on write: creating a Contract with a `property_id`/`client_id` owned by a different landlord returns `404` (not `500`, not `201`)
- [x] `CheckConstraint` enforcement: creating a Contract with `end_date` earlier than `start_date` is rejected at the database level
- [x] Cross-tenant read isolation: fetching a Contract by ID that belongs to a different landlord returns `404`

Automated coverage for these scenarios (pytest) is a planned next step.

---

## Roadmap

- [x] Base project architecture
- [x] Database models
- [x] Authentication
- [x] Multi-tenancy (data isolation via `landlord_id`)
- [x] Property CRUD endpoints
- [x] Client CRUD endpoints
- [x] Contract CRUD endpoints
- [x] Service CRUD endpoints
- [x] Manual end-to-end testing (happy path + security scenarios)
- [x] Automated tests (pytest)
- [x] Docker environment
- [ ] Documentation
- [ ] Frontend

---

## Current Status

Database layer, authentication and core CRUD are done: all models (Landlord, Property, Client, Contract, Service) have multi-tenant isolation, JWT auth with protected routes, and full CRUD endpoints, all scoped to the authenticated landlord.

Contract and Service also validate that any referenced Property/Client belongs to the authenticated landlord before allowing a write. Service exposes extra endpoints to list by property and by property + status.

Landlord registration (`POST /auth/register`) is done, and the full happy path plus main cross-tenant security scenarios were manually verified via Swagger — see [Manual Testing](#manual-testing).

Next steps: add polymorphic Notes feature.