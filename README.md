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

### Property Management

- [x] Create property
- [x] List all properties
- [x] Get property by ID
- [x] Get properties by status
- [x] Update property (PUT / PATCH)
- [x] Delete property
- [ ] Residential and commercial properties (custom fields)
- [ ] Custom property fields (JSONB)

### Client Management

- [ ] Client CRUD

### Contract Management

- [x] Contract CRUD (create, list all, get by ID, get by status, update PUT/PATCH, delete)
- [x] Property ↔ Client relationship
- [x] Rental values and dates
- [x] Cross-tenant ownership validation on referenced Property/Client (FK ownership check)

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
├── core/
│   ├── enums.py
│   ├── security.py
│   └── tenant.py
├── models/
│   ├── __init__.py
│   ├── landlord.py
│   ├── property.py
│   ├── client.py
│   ├── contract.py
│   └── service.py
├── routes/
│   ├── __init__.py
│   ├── auth.py
│   ├── property.py
│   └── contract.py
├── schemas/
│   ├── __init__.py
│   ├── landlord.py
│   ├── property.py
│   ├── client.py
│   ├── contract.py
│   └── service.py
├── tests/
├── alembic/
├── database.py
├── main.py
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

## Roadmap

- [x] Base project architecture
- [x] Database models
- [x] Authentication
- [x] Multi-tenancy (data isolation via `landlord_id`)
- [x] Property CRUD endpoints
- [x] Contract CRUD endpoints
- [ ] Client CRUD endpoints
- [ ] Service CRUD endpoints
- [ ] Automated tests
- [ ] Docker environment
- [ ] Documentation
- [ ] Frontend

---

## Current Status

LOCTIS is currently under active development.

The database layer and authentication are complete: all core models (Landlord, Property, Client, Contract, Service) are defined with multi-tenant isolation, JWT authentication is implemented with protected routes, and Pydantic schemas (create, update, response) are done for every entity.

Property and Contract now have their full set of CRUD endpoints (create, list all, get by ID, get by status, update via PUT/PATCH, delete), all scoped to the authenticated landlord. Contract endpoints additionally validate that referenced Property and Client records belong to the authenticated landlord before allowing any write, closing a cross-tenant data leakage risk. Client and Service CRUD are next in line, following the same pattern.