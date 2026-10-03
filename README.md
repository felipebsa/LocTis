<p align="center">
  <img src=".github/assets/banner-logo.png" width="100%">
</p>

**Status:** backend complete (API, auth, multi-tenancy, migrations, tests, Docker). Frontend is next.

Multi-tenant SaaS backend for landlords to manage rental properties, tenants, contracts, services and notes through a REST API.

---

## Overview

LOCTIS is a backend-first project for independent landlords and small property managers to manage properties, clients and contracts in one place.

Each landlord gets an isolated workspace: properties, clients, contracts, services and notes never leak between accounts. Every query is filtered by the authenticated landlord's `landlord_id`, and every write that references another record (e.g. a contract pointing to a property and a client) checks that the referenced record belongs to the same landlord.

The first version is backend-only. The frontend comes after the API is stable.

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
- [x] Password hashing (bcrypt)
- [x] Protected routes
- [x] Landlord registration endpoint

### Property Management

- [x] Property CRUD (create, list all, get by ID, get by status, update PUT/PATCH, delete)
- [x] Residential and commercial properties (`kind` enum + custom fields)
- [x] Custom property fields (JSONB `extra_data`)

### Client Management

- [x] Client CRUD (create, list all, get by ID, update PUT, delete)
- [x] Optional email and phone
- [x] Duplicate CPF per landlord returns `409`

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

### Notes (polymorphic)

- [x] Notes attached to a Property, Client, Contract or Service
- [x] Ownership validation of the target record
- [x] Notes are removed together with the record they belong to

### Infrastructure

- [x] PostgreSQL
- [x] Alembic migrations
- [x] Docker / Docker Compose
- [x] Automated tests with pytest
- [x] Pagination and filtering

### Future Features

- Financial dashboard
- Payment tracking
- Contract PDF storage
- Calendar view
- Rental terminology helper

---

## Domain Model

```
Landlord
│
├── Properties
├── Clients
├── Contracts   (Property ↔ Client)
├── Services    (belong to a Property)
└── Notes       (point to any of the above)
```

### Landlord

The account owner. Every resource belongs to exactly one landlord, which is what keeps data isolated between users.

### Property

A residential or commercial property available for rent. Core fields are typed columns (`address`, `cep`, `kind`, `status`); extra/custom data goes in the JSONB field `extra_data`, so each kind of property can carry its own fields (e.g. `{"pe_direito_m": 9, "docas": 4}` for a warehouse or `{"condominio": 450.0}` for an apartment).

### Client

A tenant linked to a landlord. `email` and `phone` are optional. The CPF (11 chars) is unique per landlord.

### Contract

The rental agreement connecting a landlord, a property and a client. Ownership of the referenced Property and Client is checked against the authenticated landlord on every write. A `CheckConstraint` guarantees `end_date > start_date` and `value > 0`. Extra data goes in JSONB `extra_data`.

### Service

A service (maintenance, repair, etc.) linked to a landlord and a property.

### Note

A free-text note attached to a record through `entity_type` (`property`, `client`, `contract`, `service`) and `entity_id`. There is no foreign key to the target (that is what makes it polymorphic), so the application checks that the target exists and belongs to the landlord when the note is created, and deletes the notes when the target record is deleted.

---

## API Reference

All routes except `/auth/*` require the header `Authorization: Bearer <token>`. Interactive docs: `http://localhost:8000/docs`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Property | `POST /property/register`, `GET /property/get/all`, `GET /property/get/id/{id}`, `GET /property/get/status/{status}`, `PUT /property/update/put/{id}`, `PATCH /property/update/patch/{id}`, `DELETE /property/delete/{id}` |
| Client | `POST /client/register`, `GET /client/get/all`, `GET /client/get/id/{id}`, `PUT /client/update/put/{id}`, `DELETE /client/delete/{id}` |
| Contract | `POST /contract/register`, `GET /contract/get/all`, `GET /contract/get/id/{id}`, `GET /contract/get/status/{status}`, `GET /contract/get/property/{property_id}`, `PUT /contract/update/put/{id}`, `PATCH /contract/update/patch/{id}`, `DELETE /contract/delete/{id}` |
| Service | `POST /service/register`, `GET /service/get/all`, `GET /service/get/id/{id}`, `GET /service/get/status/{status}`, `GET /service/get/property/{property_id}`, `GET /service/get/property/{property_id}/status/{status}`, `PUT /service/update/put/{id}`, `PATCH /service/update/patch/{id}`, `DELETE /service/delete/{id}` |
| Note | `POST /note/register`, `GET /note/get/all`, `GET /note/get/id/{id}`, `GET /note/get/entity/{entity_type}/{entity_id}`, `PUT /note/update/put/{id}`, `DELETE /note/delete/{id}` |

### Pagination

Every list endpoint is paginated with `?page=` (starts at 1) and `?limit=` (default 24, min 1, max 100, enforced by the server). Results are ordered by `created_at` (then `id`) and returned as:

```json
{
  "items": [ ... ],
  "page_atual": 1,
  "page_max": 3
}
```

`page_max` is always at least 1, and a page beyond the last one returns `items: []`. Values outside the allowed range return `422`.

### Filters (`GET .../get/all`)

| Resource | Query params |
|---|---|
| Property | `status`, `kind`, `address` (partial, case-insensitive) |
| Client | `name` (partial, case-insensitive), `cpf` (exact) |
| Contract | `status`, `property_id`, `client_id` |
| Service | `status`, `property_id` |
| Note | `entity_type`, `entity_id` |

Filters combine with `AND` and with pagination, e.g. `GET /property/get/all?kind=house&status=available&limit=10&page=2`.

### Error codes

| Code | When |
|---|---|
| `400` | Contract with `end_date <= start_date` or `value <= 0` |
| `401` | Missing/invalid token or wrong credentials |
| `404` | Record not found **or belongs to another landlord** (same response on purpose) |
| `409` | Email already registered, or CPF already registered for this landlord |
| `422` | Validation error (bad enum value, CPF length, empty note, pagination out of range) |

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
│   │   ├── enums.py        # PropertyKind, PropertyStatus, ContractStatus, ServiceStatus, NoteEntityType
│   │   ├── pagination.py   # Pagination dependency, Page schema, paginate()
│   │   ├── security.py     # JWT + password hashing + get_current_user
│   │   └── tenant.py       # ownership lookup and note cleanup helpers
│   ├── models/             # landlord, property, client, contract, service, note
│   ├── routes/             # landlord, property, client, contract, service, note
│   ├── schemas/            # landlord, property, client, contract, service, note
│   ├── database.py
│   └── main.py
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_property.py
│   ├── test_client.py
│   ├── test_contract.py
│   ├── test_service.py
│   ├── test_note.py
│   └── test_pagination.py
├── alembic/
│   └── versions/
├── alembic.ini
├── Dockerfile
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

Create `backend/.env` with:

```
SECRET_KEY=a_long_random_string
ALGORITHM=HS256
TOKEN_EXPIRED=30
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/loctis
```

(Inside Docker Compose the `api` service overrides `DATABASE_URL` to point at the `db` container.)

Then run:

```bash
docker compose up --build
docker compose exec api alembic upgrade head
```

API available at `http://localhost:8000/docs`.

### Migrations

```bash
docker compose exec api alembic upgrade head                        # apply
docker compose exec api alembic revision --autogenerate -m "msg"    # create
docker compose exec api alembic downgrade -1                        # undo last
```

Current chain: `create initial tables` → `fix address column typo in property` → `add extra_data to property` → `create notes table`.

---

## Running the Tests

Tests use a separate database so they never touch your dev data (each test drops and recreates the tables).

1. Create an empty database for tests (e.g. `loctis_test`).
2. Create `backend/.env.test`:

```
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/loctis
DATABASE_URL_TEST=postgresql://your_user:your_password@localhost:5432/loctis_test
SECRET_KEY=test_secret
ALGORITHM=HS256
TOKEN_EXPIRED=30
```

3. From `backend/`:

```bash
pip install -r requirements.txt
pytest
```

Coverage: auth, CRUD for every resource, multi-tenant isolation (another landlord gets `404` on read, update and delete), contract date/value constraint, optional client fields, duplicate CPF, `extra_data`, filters, pagination limits and ordering, and notes (ownership, polymorphic typing, cleanup on delete).

---

## Manual Testing

Core flow and security-critical paths were also verified end-to-end via Swagger UI (2026-08-15):

**Happy path**
- [x] Landlord registration → login → JWT issuance
- [x] Property creation, scoped to the authenticated landlord
- [x] Client creation, scoped to the authenticated landlord
- [x] Contract creation referencing a valid Property/Client owned by the landlord

**Security / risk scenarios**
- [x] Cross-tenant ownership on write: creating a Contract with a `property_id`/`client_id` owned by a different landlord returns `404` (not `500`, not `201`)
- [x] `CheckConstraint` enforcement: creating a Contract with `end_date` earlier than `start_date` is rejected
- [x] Cross-tenant read isolation: fetching a Contract by ID that belongs to a different landlord returns `404`

These scenarios are now also covered by the automated pytest suite.

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
- [x] Pagination and filtering
- [x] Notes (polymorphic)
- [x] Documentation
- [ ] Frontend

---

## Current Status

The backend is feature-complete for the first version: JWT auth, five resources plus notes, all scoped to the authenticated landlord, with pagination, filters, migrations, Docker and an automated test suite.

Next step: frontend.
