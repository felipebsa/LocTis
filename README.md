<p align="center">

  <img src=".github/assets/banner-logo.png" width="100%">

</p>

**Status:** full stack working — backend (API, authentication, multi-tenancy, migrations, tests, Docker), web dashboard and landing page.

Multi-tenant SaaS for landlords and small property managers to manage properties, clients, contracts, services and notes through a REST API, web dashboard and landing page.

---

## Overview

LOCTIS is a project built for independent landlords and small property managers to manage properties, clients and contracts in one place.

Each landlord has an isolated workspace: properties, clients, contracts, services and notes are never shared between accounts.

Every query is scoped to the authenticated landlord's `landlord_id`, and operations that reference other records also verify that those records belong to the same landlord.

The project was developed **backend-first**, with the API and core backend architecture built before integrating the web dashboard.

---

## How this project was built

### Backend

The **backend was designed and developed by me**, including the API architecture, database models, authentication, multi-tenancy, business rules, migrations, automated tests and Docker environment.

Main technologies:

**FastAPI, PostgreSQL, SQLAlchemy, Alembic, Pydantic, pytest and Docker.**

### Frontend

The dashboard and landing page UI were initially generated with **v0 by Vercel** and then integrated with the backend API.

I used **Claude Code** as a development assistant mainly for frontend integration, along with some occasional debugging and testing support.

AI was used as a development tool, not as a replacement for understanding the code. Since this is a learning project, I also used explanations of AI-assisted changes to understand what was being implemented and how it worked.

---

## Goals

This project was built to study concepts used in real backend systems:

* Multi-tenant architecture
* JWT authentication
* Database migrations
* Automated testing
* Dockerized development
* Modular project structure
* Connecting a frontend application to a real API

---

## Features

### Authentication

* [x] JWT authentication
* [x] Password hashing with bcrypt
* [x] Protected routes
* [x] Landlord registration
* [x] `GET /auth/me`

### Property Management

* [x] Property CRUD
* [x] Residential and commercial properties
* [x] Custom property fields using JSONB
* [x] Protection against deleting properties with linked contracts or services

### Client Management

* [x] Client CRUD
* [x] Optional email and phone
* [x] Duplicate CPF validation per landlord
* [x] Protection against deleting clients with linked contracts

### Contract Management

* [x] Contract CRUD
* [x] Contracts by property
* [x] Property ↔ Client relationship
* [x] Rental values and dates
* [x] Cross-tenant ownership validation
* [x] Database constraints for contract dates and values

### Service Management

* [x] Service CRUD
* [x] Services by property
* [x] Services by property and status
* [x] Ownership validation when changing the property

### Notes

* [x] Notes attached to properties, clients, contracts or services
* [x] Ownership validation
* [x] Automatic cleanup when the target record is deleted

### Infrastructure

* [x] PostgreSQL
* [x] Alembic migrations
* [x] Docker / Docker Compose
* [x] Automated tests with pytest
* [x] Pagination and filtering

### Frontend

* [x] Authentication connected to the API
* [x] CRUD pages for the main resources
* [x] Search, filters and pagination
* [x] Input masks and validation
* [x] Dashboard using real API data
* [x] Financial reports
* [x] Notifications
* [x] CSV export
* [x] Responsive landing page

---

## Domain Model

```text
Landlord
│
├── Properties
├── Clients
├── Contracts  (Property ↔ Client)
├── Services   (belong to a Property)
└── Notes      (point to any of the above)
```

Every resource belongs to exactly one landlord. This ownership relationship is the foundation of the project's multi-tenant data isolation.

---

## API

All routes except `/auth/register` and `/auth/login` require:

```http
Authorization: Bearer <token>
```

Interactive documentation:

```text
http://localhost:8000/docs
```

| Resource | Endpoints                                                                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth     | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                                                                                                                                                                                                                                                                 |
| Property | `POST /property/register`, `GET /property/get/all`, `GET /property/get/id/{id}`, `GET /property/get/status/{status}`, `PUT /property/update/put/{id}`, `PATCH /property/update/patch/{id}`, `DELETE /property/delete/{id}`                                                                                                |
| Client   | `POST /client/register`, `GET /client/get/all`, `GET /client/get/id/{id}`, `PUT /client/update/put/{id}`, `DELETE /client/delete/{id}`                                                                                                                                                                                    |
| Contract | `POST /contract/register`, `GET /contract/get/all`, `GET /contract/get/id/{id}`, `GET /contract/get/status/{status}`, `GET /contract/get/property/{property_id}`, `PUT /contract/update/put/{id}`, `PATCH /contract/update/patch/{id}`, `DELETE /contract/delete/{id}`                                                    |
| Service  | `POST /service/register`, `GET /service/get/all`, `GET /service/get/id/{id}`, `GET /service/get/status/{status}`, `GET /service/get/property/{property_id}`, `GET /service/get/property/{property_id}/status/{status}`, `PUT /service/update/put/{id}`, `PATCH /service/update/patch/{id}`, `DELETE /service/delete/{id}` |
| Note     | `POST /note/register`, `GET /note/get/all`, `GET /note/get/id/{id}`, `GET /note/get/entity/{entity_type}/{entity_id}`, `PUT /note/update/put/{id}`, `DELETE /note/delete/{id}`                                                                                                                                            |

### Pagination

All list endpoints support pagination:

```text
?page=1&limit=24
```

`limit` accepts values between 1 and 100.

Example response:

```json
{
  "items": [],
  "page_atual": 1,
  "page_max": 3,
  "total": 61
}
```

### Filters

List endpoints support resource-specific filters such as status, property, client, type and address.

Filters can be combined with pagination.

---

## Tech Stack

### Backend

* Python 3
* FastAPI
* SQLAlchemy 2.0
* Pydantic
* PostgreSQL
* Alembic
* Pytest
* Uvicorn

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* lucide-react
* v0 by Vercel

### Infrastructure

* Docker
* Docker Compose

---

## Project Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── enums.py
│   │   ├── pagination.py
│   │   ├── security.py
│   │   └── tenant.py
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── database.py
│   └── main.py
├── tests/
├── alembic/
├── alembic.ini
├── Dockerfile
└── requirements.txt

frontend/
├── app/
├── components/
└── lib/

landing/
```

---

## Local Development

### Requirements

* Python 3.12+
* Docker
* Docker Compose

```bash
git clone https://github.com/felipebsa/loctis.git
cd loctis
```

Create the required `.env` files and run:

```bash
docker compose up --build -d
docker compose exec api alembic upgrade head
```

API:

```text
http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard:

```text
http://localhost:3000
```

### Landing Page

```bash
cd landing
npm install
npm run dev -- -p 3001
```

Landing page:

```text
http://localhost:3001
```

---

## Running the Tests

The project uses a separate database for tests.

```bash
cd backend
pip install -r requirements.txt
pytest
```

The project currently has **85 tests** covering authentication, CRUD operations, multi-tenant isolation, business rules, pagination, filtering, notes and other API behavior.

Security-related scenarios include:

* cross-tenant read isolation;
* ownership validation on write operations;
* contract date validation;
* ownership validation of related resources.

---

## Roadmap

* [x] Base project architecture
* [x] Database models
* [x] Authentication
* [x] Multi-tenancy
* [x] CRUD endpoints
* [x] Automated tests
* [x] Docker environment
* [x] Pagination and filtering
* [x] Notes
* [x] Documentation
* [x] Frontend integration
* [x] Landing page
* [ ] Payments and received-revenue reports
* [ ] Production preparation

---

## Current Status

The first complete version of LOCTIS is working, including:

* JWT authentication
* Multi-tenant data isolation
* Five main resources and notes
* REST API
* PostgreSQL
* Database migrations
* Docker
* Automated tests
* Web dashboard
* Landing page

### Current Limitations

Some features are not part of the current version yet:

* Payment tracking and received revenue are not implemented.
* Financial data currently represents contracted revenue.
* The dashboard still uses API records to calculate some data instead of dedicated summary endpoints.
* Notification state is stored locally in the browser.
* Profile editing is not available yet.

### Next Steps

* Payment tracking and received-revenue reports
* Dedicated summary endpoints for the dashboard
* Event and change history
* Profile editing
* Security improvements and production preparation
