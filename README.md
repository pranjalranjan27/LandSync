# LandSync — Government Land Acquisition Workflow Platform Backend

Production-grade, layered backend for statutory land acquisition workflows (Smart India Hackathon / SIH 2026). Built with **Python 3.11+**, **FastAPI**, **PostgreSQL 15+ with PostGIS**, **SQLAlchemy 2.0**, **Alembic**, and **Pydantic v2**, enforcing a hybrid **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)** security model.

---

## 1. Quick Start: Running Locally

### Option A: Using Docker Compose (Recommended)

1. **Clone the repository and navigate to `backend/`**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Launch the PostgreSQL+PostGIS and FastAPI services**:
   ```bash
   docker compose up --build -d
   ```

3. **Apply Alembic database migrations**:
   ```bash
   docker compose exec api alembic upgrade head
   ```

4. **Seed demo data (50 parcels, 7 demo accounts, 5 sample cases)**:
   ```bash
   docker compose exec api python -m app.seed.seed_data
   ```

5. **Access the platform**:
   - Interactive Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Local Python Environment

1. **Create and activate a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   # On Linux/macOS:
   source venv/bin/activate
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Ensure DATABASE_URL points to a PostgreSQL instance with PostGIS enabled:
   # Example: postgresql+psycopg2://postgres:postgrespassword@localhost:5432/landsync_db
   ```

4. **Run Migrations & Seed Data**:
   ```bash
   alembic upgrade head
   python -m app.seed.seed_data
   ```

5. **Start Development Server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 2. Layered Architecture & Separation of Concerns

The backend strictly separates concerns into seven distinct architectural layers. Every source file contains header commentary delineating allowed versus prohibited responsibilities:

```
backend/
├── app/
│   ├── core/           # Configuration, security primitives, and shared deps
│   ├── db/             # SQLAlchemy engine, sessionmaker, base, transaction context
│   ├── models/         # ORM entities, PostGIS spatial mapping, canonical enums
│   ├── schemas/        # Pydantic v2 request/response models, GeoJSON serializers
│   ├── repositories/   # Raw database queries (CRUD); strictly no business/auth logic
│   ├── services/       # Workflow rules, RBAC/ABAC enforcement, stage transition validation
│   ├── api/
│   │   ├── routes/     # Thin controllers parsing HTTP → calling services → returning DTOs
│   │   └── dependencies.py # Reusable get_current_user, require_role, require_jurisdiction_match
│   └── seed/           # Standalone demo data seeder
├── alembic/            # Database schema migrations
└── tests/              # Pytest test suite (RBAC, ABAC, stage machine, audit immutability)
```

### Layer Rationale & Boundaries

1. **`core/` (Foundational Primitives)**:
   - *Allowed*: Loads typed environment settings (`config.py`), implements bcrypt password hashing, and signs/validates JWTs (`security.py`).
   - *Prohibited*: Never imports models, schemas, repositories, or services; remains completely decoupled from domain logic.
2. **`db/` (Database Connection & Lifecycle)**:
   - *Allowed*: Instantiates the SQLAlchemy 2.0 connection pool, declarative base, and atomic transaction context managers.
   - *Prohibited*: Never writes table-specific queries, HTTP handlers, or business evaluation logic.
3. **`models/` (Relational & Spatial Schema)**:
   - *Allowed*: Defines relational tables, foreign key constraints, PostGIS `Geometry(POLYGON, 4326)` columns via GeoAlchemy2, and the single source of truth for domain enums.
   - *Prohibited*: No business validation, no workflow stage evaluation, and no audit log auto-triggers.
4. **`schemas/` (Data Transfer Objects)**:
   - *Allowed*: Defines Pydantic v2 validation models, action request bodies, and RFC 7946 compliant GeoJSON Feature and FeatureCollection serializers.
   - *Prohibited*: Contains zero database queries and never imports SQLAlchemy sessions or models directly.
5. **`repositories/` (Data Access Layer)**:
   - *Allowed*: Executes raw SQLAlchemy queries (`select`, `add`, `flush`, `join`) and returns model instances.
   - *Prohibited*: Strictly forbidden from evaluating permissions or business policies. Contains **no update or delete methods for `audit_log`** (guaranteeing legal immutability).
6. **`services/` (Business Logic & Enforcement)**:
   - *Allowed*: Enforces statutory workflow rules, the explicit stage transition graph (rejecting illegal transitions with HTTP 409), ABAC territorial matching (HTTP 403), and executes single-transaction state changes with audit logging.
   - *Prohibited*: Never constructs raw SQL queries (delegates to repositories) and never handles HTTP request parsing.
7. **`api/routes/` & `api/dependencies.py` (Presentation & Security Gates)**:
   - *Allowed*: Composes `require_role(*roles)` and `require_jurisdiction_match()` on endpoints, parses HTTP parameters, and calls service functions.
   - *Prohibited*: Routers never import repositories or talk to the database directly.

---

## 3. Statutory Workflow Stage Transition Graph

LandSync models the legal lifecycle under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act (RFCTLARR). Stage jumps are validated against an explicit transition map in `app/services/stage_machine.py`. Illegal transitions are rejected with HTTP 409 Conflict.

### Workflow State Diagram

```mermaid
stateDiagram-v2
    [*] --> proposal_submitted: Requiring Body Submits
    
    proposal_submitted --> district_review: Collector Review
    proposal_submitted --> returned_for_clarification: Incomplete Details
    proposal_submitted --> rejected: Rejected
    
    district_review --> state_review: Collector Approval
    district_review --> returned_for_clarification
    district_review --> rejected
    
    state_review --> sia_in_progress: State Committee Sanction
    state_review --> returned_for_clarification
    state_review --> rejected
    
    sia_in_progress --> notification_published: SIA Verdict + Hearing
    sia_in_progress --> returned_for_clarification
    sia_in_progress --> rejected
    
    notification_published --> objections_window: Section 11 Published
    
    objections_window --> award_declared: Objections Disposed & Award Prepared
    objections_window --> returned_for_clarification
    
    award_declared --> compensation_disbursed: Direct Benefit Transfer
    
    compensation_disbursed --> possession_taken: Land Possession Vested
    
    possession_taken --> rr_in_progress: R&R Scheme Execution
    possession_taken --> completed: No Resettlement Needed
    
    rr_in_progress --> completed: Families Verified & Resettled
    
    returned_for_clarification --> proposal_submitted: Resubmitted by Requiring Body
    returned_for_clarification --> district_review: Additional Documents Uploaded
    
    rejected --> [*]
    completed --> [*]
```

### Transition Permissions Matrix

| Current Stage | Permitted Next Stages | Required Role |
| :--- | :--- | :--- |
| `proposal_submitted` | `district_review`, `returned_for_clarification`, `rejected` | `district_collector` |
| `district_review` | `state_review`, `returned_for_clarification`, `rejected` | `district_collector` |
| `state_review` | `sia_in_progress`, `returned_for_clarification`, `rejected` | `state_approver` |
| `sia_in_progress` | `notification_published`, `returned_for_clarification`, `rejected` | `district_collector` (after `sia_expert` verdict) |
| `notification_published` | `objections_window` | Automatic upon notification |
| `objections_window` | `award_declared`, `returned_for_clarification` | `district_collector` |
| `award_declared` | `compensation_disbursed` | `district_collector` |
| `compensation_disbursed` | `possession_taken` | `district_collector` |
| `possession_taken` | `rr_in_progress`, `completed` | `district_collector` / `rr_administrator` |
| `rr_in_progress` | `completed` | `rr_administrator` |
| `returned_for_clarification`| `proposal_submitted`, `district_review` | `requiring_body` |
| `rejected` | *None (Terminal)* | — |
| `completed` | *None (Terminal)* | — |

---

## 4. RBAC + ABAC Hybrid Security Model

Access control evaluates both **Role-Based (RBAC)** and **Attribute-Based (ABAC)** permissions on every protected request:
- **RBAC**: User role tag (`requiring_body`, `district_collector`, `state_approver`, `sia_expert`, `rr_administrator`, `field_officer`, `policy_viewer`).
- **ABAC**: Jurisdiction scope (`national`, `state`, `district`) checked against the target case or parcel's district/state ID. A Collector from District A attempting to read or act on a case in District B receives an immediate **HTTP 403 Forbidden**, preventing IDOR vulnerabilities.

---

## 5. Demonstration Accounts

All accounts are pre-seeded with the password: **`password123`**

| Role Tag | Email Address | Jurisdiction Scope | Jurisdiction ID |
| :--- | :--- | :--- | :--- |
| `requiring_body` | `requiring_body@landsync.gov.in` | District | Gautam Buddha Nagar |
| `district_collector`| `collector@landsync.gov.in` | District | Gautam Buddha Nagar |
| `state_approver` | `state_approver@landsync.gov.in` | State | Uttar Pradesh |
| `sia_expert` | `sia_expert@landsync.gov.in` | State | Uttar Pradesh |
| `rr_administrator` | `rr_admin@landsync.gov.in` | District | Gautam Buddha Nagar |
| `field_officer` | `field_officer@landsync.gov.in` | District | Gautam Buddha Nagar |
| `policy_viewer` | `policy_viewer@landsync.gov.in` | National | *All Jurisdictions* |

---

## 6. Seeded Demonstration Cases

1. **`proposal_submitted`**: *Jewar Airport Rail Cargo Link Phase 1* (5 parcels in Gautam Buddha Nagar).
2. **`sia_in_progress`**: *Yamuna Expressway Industrial Sector 24* (8 parcels, SIA verdict submitted by expert, public hearing minutes attached).
3. **`rr_in_progress`**: *Dadri Multimodal Logistics Hub Expansion* (10 parcels, ₹48.5 Cr statutory award declared, R&R scheme initiated, 3 affected families tracked with milestone logs).
4. **`completed`**: *Noida Power Grid Substation Alpha* (4 parcels with status marked `acquired`, full chronological audit trail).
5. **`district_review`**: *Greater Noida Metro Line Extension Phase 3* (6 parcels, forwarded for district scrutiny).
