<p align="center">
  <img src=".github/assets/banner-logo.png" width="100%">
</p>

🚧 **Status:** In Development

Multi-tenant SaaS backend for landlords to manage rental properties, tenants, and contracts through a secure REST API.

---

## Overview

LOCTIS is a backend-first SaaS designed for independent landlords and small property managers.

Each landlord has a completely isolated workspace, ensuring that properties, clients, and contracts are never shared between accounts. The API is being built with scalability, maintainability, and production-oriented backend practices in mind.

The first version focuses entirely on the backend. A frontend application will be developed after the API reaches a stable state.

---

## Goals

Rather than being just another CRUD project, LOCTIS aims to explore concepts commonly found in real production systems, including:

- Multi-tenant architecture
- JWT authentication
- Database migrations
- Automated testing
- Dockerized deployment
- Modular and scalable project structure

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
- [ ] Docker / Docker Compose
- [ ] Automated tests with pytest
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

Represents the account owner.

Every resource inside the system belongs to exactly one landlord, ensuring complete data isolation between users.

### Property

Represents a residential or commercial property available for rent.

Core attributes are stored as typed columns, while advanced or custom information is stored using a JSONB field (`extra_data`).

### Client

Represents a tenant linked to a landlord.

### Contract

Represents the rental agreement connecting a landlord, a property, and a client. Ownership of the referenced Property and Client is validated against the authenticated landlord on every write operation, preventing cross-tenant data leakage.

### Service

Represents a service (maintenance, repair, etc.) linked to a landlord and a property.

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
- PostgreSQL
- Docker

```bash
git clone https://github.com/felipebsa/loctis.git

cd loctis
```

Setup instructions will be added once the base architecture is complete.

---

## Manual Testing

The core flow and the main security-critical paths were manually verified end-to-end via Swagger UI (2026-08-15):

**Happy path**
- [x] Landlord registration → login → JWT issuance
- [x] Property creation, scoped to the authenticated landlord
- [x] Client creation, scoped to the authenticated landlord
- [x] Contract creation referencing a valid Property/Client owned by the landlord

**Security / risk scenarios**
- [x] Cross-tenant ownership on write: creating a Contract with a `property_id`/`client_id` owned by a different landlord returns `404` (not `500`, not `201`)
- [x] `CheckConstraint` enforcement: creating a Contract with `end_date` earlier than `start_date` is rejected at the database level
- [x] Cross-tenant read isolation: fetching a Contract by ID that belongs to a different landlord returns `404`

Automated coverage for these scenarios (pytest) is a planned next step — see Roadmap.

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
- [~] Automated tests (auth register covered, more in progress)
- [ ] Docker environment
- [ ] Documentation
- [ ] Frontend

---

## Current Status

LOCTIS is currently under active development.

The database layer, authentication, and core CRUD API are complete: all models (Landlord, Property, Client, Contract, Service) are defined with multi-tenant isolation, JWT authentication is implemented with protected routes, and every entity has its full set of endpoints (create, list all, get by ID, update via PUT/PATCH where applicable, delete), all scoped to the authenticated landlord.

Contract and Service additionally validate that any referenced Property/Client belongs to the authenticated landlord before allowing a write, closing a cross-tenant data leakage risk. Service also exposes convenience endpoints to list by property and by property + status, avoiding the need for client-side filtering.

A dedicated landlord registration endpoint (`POST /auth/register`) was added, and the full happy path plus the main cross-tenant security scenarios were manually verified end-to-end via Swagger — see [Manual Testing](#manual-testing).

Next steps: automated tests (pytest), Docker environment, and the polymorphic Notes feature.