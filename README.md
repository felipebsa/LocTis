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

- [ ] JWT Authentication
- [ ] Password hashing
- [ ] Protected routes

### Property Management

- [ ] Property CRUD
- [ ] Residential and commercial properties
- [ ] Custom property fields (JSONB)

### Client Management

- [ ] Client CRUD

### Contract Management

- [ ] Contract CRUD
- [ ] Property ↔ Client relationship
- [ ] Rental values and dates

### Infrastructure

- [ ] PostgreSQL
- [ ] Alembic migrations
- [ ] Docker / Docker Compose
- [ ] Automated tests with pytest
- [ ] Pagination and filtering

### Future Features

- Financial dashboard
- Payment tracking
- Contract PDF storage
- Calendar view
- Notes per entity
- Rental terminology helper

---

## Domain Model

```
Landlord
│
├── Properties
├── Clients
└── Contracts
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

Represents the rental agreement connecting a landlord, a property, and a client.

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
│   ├── api/
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── repositories/
│
├── tests/
├── alembic/
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

- [ ] Base project architecture
- [ ] Database models
- [ ] Authentication
- [ ] Multi-tenancy
- [ ] CRUD endpoints
- [ ] Automated tests
- [ ] Docker environment
- [ ] Documentation
- [ ] Frontend

---

## Current Status

LOCTIS is currently under active development.

The current milestone focuses on establishing the project's architecture, authentication system, multi-tenant data isolation, and database layer before implementing business features.
