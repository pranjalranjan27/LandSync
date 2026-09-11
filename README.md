# LandSync (NALAMS)
### National Land Acquisition & Management System

> **A unified, transparent, and legally binding digital platform for sovereign land acquisition across India, governed under the RFCTLARR Act 2013 and GIGW 3.0 standards.**

---

## 🏛️ Overview

**LandSync** is India's next-generation digital portal designed to streamline, standardize, and accelerate the statutory land acquisition lifecycle. Operating across central ministries, state revenue departments, requiring bodies, and affected citizens, LandSync guarantees statutory compliance, auditable transparency, and accelerated infrastructure delivery.

Built in alignment with:
- **RFCTLARR Act 2013** (*Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act*)
- **GIGW 3.0** (*Guidelines for Indian Government Websites*)
- **WCAG 2.1 AAA** Accessibility Standards

---

## 🌟 Key Features

### 1. End-to-End Statutory Lifecycle Management
Tracks and enforces all statutory milestones from proposal to possession:
- **Section 4**: DPR & Proposal Submission with Cadastral Parcel Identification
- **Section 7**: Social Impact Assessment (SIA) Study & Expert Committee Review
- **Section 8**: State Government Appraisal & Administrative Approval
- **Section 11**: Preliminary Notification & Public Notice Issuance
- **Section 15**: Public Objections Logging & Quasi-Judicial Collector Hearings
- **Section 16 & 19**: Rehabilitation & Resettlement (R&R) Scheme Formulation & Declaration
- **Section 23 & 31**: Compensation Award Inquiry, Solatium Computation & Direct Benefit Transfer (DBT)
- **Section 38**: Physical Possession & Asset Handover

### 2. Statutory Role-Based Access Control (RBAC)
Strict frontend and backend access boundaries ensure officials access only the jurisdictions and actions authorized by law:
- **Requiring Body (`REQUIRING_BODY`)**: Submit land requirement proposals, upload DPRs, track acquisition progress.
- **District Collector (`COLLECTOR`)**: Apex statutory authority; issue Section 11 notices, conduct hearings, approve valuation awards.
- **State Approver (`STATE_APPROVER`)**: Review and clear Section 8 state-level proposals and budgetary sanctions.
- **SIA Expert (`SIA_EXPERT`)**: Conduct social impact assessments, record public consultations, submit Section 7 appraisal reports.
- **R&R Administrator (`RR_ADMIN`)**: Formulate Resettlement Schemes, verify PAF/PDF entitlement matrices under Section 16 & 31.
- **Field Officer / Amin (`FIELD_OFFICER`)**: Execute ground surveys, verify village cadastral boundaries, record Joint Measurement Surveys (JMS).
- **Policy Viewer / Auditor (`POLICY_VIEWER`)**: Oversight, national dashboards, state-wise bottlenecks, and KPI analytics.
- **Citizen / Landowner (`CITIZEN`)**: Search public notices, check compensation disbursement status, and submit Section 15 objections.

### 3. Integrated Core Modules
- **Dynamic Role Dashboards**: Personalized overview with priority action queues, statutory deadline alerts, and case filters.
- **Case Queue & Deep-Dive Detail (`/cases`, `/cases/:id`)**: Comprehensive case audit trails, interactive stage steppers, and parcel ledgers.
- **Proposal Submission Engine (`/cases/new`)**: Multi-step wizard for project registration and parcel selection.
- **Objections Registry (`/objections/new`)**: Direct filing for affected landowners with automated acknowledgment receipts.
- **Central Document Repository (`/documents`)**: Filterable document management system supporting Section 11 gazettes, SIA reports, valuation awards, and deed records.
- **Multilingual Support (6 Indian Languages)**: Complete localization for English, हिन्दी (Hindi), मराठी (Marathi), தமிழ் (Tamil), తెలుగు (Telugu), and বাংলা (Bengali).
- **Notifications Hub (`/notifications`)**: Action-required alerts, legal notices, and statutory updates categorized with unread management.
- **Profile & Security (`/profile`)**: Manage official credentials, notification preferences, session logs, and jurisdiction assignment.
- **Design System Reference (`/design-system`)**: Interactive documentation of colors, typographic scale, status badges, and UI components.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 8](https://vitejs.dev/) |
| **Styling** | Vanilla CSS with Semantic Design Tokens (`tokens.css`, `typography.css`) |
| **Routing** | [React Router v6](https://reactrouter.com/) with statutory `ProtectedRoute` RBAC guards |
| **Localization** | Custom lightweight React Context i18n engine (`useLanguage`, `useTranslation`) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 📂 Project Structure

```text
src/
├── app/                  # Application root, routing & RBAC route guards
│   ├── App.tsx           # Top-level shell provider
│   ├── ProtectedRoute.tsx# Statutory RBAC authorization guard (403 handler)
│   └── routes.tsx        # Application route hierarchy
├── assets/               # National emblems, logos, and static media
├── case-detail/          # Deep-dive case management views & tabbed panels
├── components/           # Shared reusable atomic components (Buttons, Steppers, Cards)
│   ├── AuditLogFeed/     # Timestamped statutory action timeline
│   ├── Button/           # Standard GIGW button variations
│   ├── CaseCard/         # Case summary card with progress indicators
│   ├── StatusBadge/      # Official statutory status pill badges
│   └── WorkflowStepper/  # Statutory lifecycle stepper component
├── features/             # Feature slices & domain-specific workflows
│   ├── auth/             # Login, OTP verification, password reset, registration
│   ├── cases/            # District case queue and filtering table
│   ├── collector/        # District Collector command center
│   ├── design-system/    # Living styleguide & token catalog
│   ├── landing/          # Public citizen-facing portal homepage
│   ├── objections/       # Section 15 objection logging and hearing tracker
│   ├── policy-viewer/    # National & state macro analytics reports
│   └── requiring-body/   # Proposal tracking for project authorities
├── hooks/                # Custom React hooks (useAuth, useTranslation, useLanguage)
├── locales/              # Multilingual dictionary files (en, hi, mr, ta, te, bn)
├── mock-data/            # Synthetic data conforming to statutory RFCTLARR schema
├── pages/                # Top-level page views (Dashboard, Documents, Notifications, Profile)
├── shell/                # App frame (Sidebar navigation, TopBar, SkipLink accessibility)
├── styles/               # Design system tokens, typography scales, layout reset
├── types/                # Strict TypeScript domain models & statutory role enums
└── utils/                # Statutory RBAC engine & date/currency formatters
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/landsync.git
   cd landsync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` to explore the portal.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔐 Security & Statutory Compliance

- **Role-Based Access Control (RBAC)**: All administrative routes and actions validate the authenticated user's statutory role.
- **Session Preservation**: Authentication credentials and active role states are maintained via secure session handlers.
- **Audit Trails**: Every lifecycle transition, objection ruling, and document upload maintains immutable actor and timestamp metadata.
- **Digital India Standards**: Compliant with National Informatics Centre (NIC) and Ministry of Electronics & IT (MeitY) guidelines.

---

## 📜 License

Government of India / LandSync Project. All rights reserved.
