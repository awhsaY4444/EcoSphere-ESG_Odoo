# 🌍 EcoSphere_ESG

**ESG Intelligence & Sustainability Management Platform**

> Measure → Trace → Understand → Predict → Simulate → Act → Reward

EcoSphere_ESG is an intelligent **Environmental, Social, and Governance (ESG) Management Platform** that helps organizations measure, manage, analyze, and improve their sustainability performance through a single unified ERP-integrated system — combining environmental monitoring, employee participation, governance compliance, gamification, and explainable AI-driven insights.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Innovations](#key-innovations)
- [Core Modules](#core-modules)
- [Data Model](#data-model)
- [Business Workflow](#business-workflow)
- [Core Configuration & Business Rules](#core-configuration--business-rules)
- [Reports](#reports)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Screens & Navigation](#screens--navigation)

## Problem Statement

Organizations are increasingly expected to monitor carbon emissions, promote employee well-being, manage sustainability initiatives, and maintain governance compliance. However, ESG reporting today is typically:

- Manual and spreadsheet-dependent
- Disconnected from everyday business operations
- Difficult to monitor in real time
- Reactive rather than predictive
- Hard to trace back to the individual operational activity that caused it

EcoSphere_ESG solves this by embedding ESG management directly into day-to-day operations and turning raw ESG data into actionable, explainable intelligence — not just another dashboard bolted onto existing systems.

## Our Solution

EcoSphere centralizes the four ESG pillars into one platform:

| Pillar | What it covers |
|---|---|
| 🌱 **Environmental** | Carbon accounting, emission factor configuration, automatic emission calculation, carbon transaction tracking, department-level carbon monitoring, product ESG profiles, environmental goals, sustainability analytics |
| 🤝 **Social** | CSR activity management, employee participation, evidence submission & approval, diversity metrics, engagement analytics, training completion tracking |
| ⚖️ **Governance** | ESG policy management, policy acknowledgements, governance audits, compliance issue tracking, issue ownership & due dates, overdue compliance alerts, governance risk visualization |
| 🎮 **Gamification** | Sustainability challenges, XP and points, auto-awarded badges, reward redemption, employee leaderboards, verified sustainability impact tracking |

All four pillars roll up into a single, weighted **Overall ESG Score** per department and organization-wide.

## Key Innovations

### 🔮 EcoTwin — ESG Digital Twin & What-If Simulator
Lets organizations simulate sustainability decisions before implementing them.

*"What if diesel consumption is reduced by 30%?"*

EcoTwin projects:
- Carbon reduction impact
- Environmental score improvement
- Overall ESG score change
- Effect on active sustainability goals

Multiple scenarios can be run side by side to identify the highest-impact strategy before committing resources.

### 🧭 EcoPilot — Explainable ESG Intelligence Assistant
A natural-language assistant that answers questions using the organization's actual ESG data — not generic advice.

Example questions it answers:
- "Why did our ESG score decrease this month?"
- "Which department needs immediate attention?"
- "Which environmental goal is most likely to fail?"
- "What are the highest-impact actions we can take right now?"

Every answer is grounded in and cites the underlying ESG records (transactions, scores, audits) that produced it — no black-box claims.

### 🧬 Carbon DNA — End-to-End Emission Traceability
Traces any emission figure from the top-level dashboard all the way down to the exact operational record that generated it:

`Organization Emissions` → `Logistics Department` → `Fleet Operations` → `Vehicle / Source Record` → `Diesel Transaction` → `Quantity × Emission Factor = CO₂e`

This gives auditors and sustainability officers a fully explainable chain of custody for every gram of reported CO₂e — answering "where did this number come from?" with a real answer, not a re-aggregation.

## Core Modules

### 1. Environmental
- Configure Emission Factors
- Calculate Carbon Emissions (manual + automatic)
- Department Carbon Tracking
- Sustainability Goals with progress tracking
- Environmental Dashboard

### 2. Social
- CSR Activities (create, categorize, track participation)
- Employee Participation (with evidence/proof upload)
- Diversity Metrics
- Training Completion

### 3. Governance
- ESG Policies
- Policy Acknowledgements
- Audits (scoped by department/date range, assigned auditors)
- Compliance Issues (severity, ownership, due dates)

### 4. Gamification
- Challenges with full lifecycle: Draft → Active → Under Review → Completed, or Archived at any point
- XP accumulation
- Badges — auto-awarded when an employee's XP or completed-challenge count satisfies a Badge's Unlock Rule
- Rewards — redeemable using earned XP/Points, subject to stock availability
- Leaderboards (individual and department-level)

### 5. Settings & Administration
- Departments management
- Category management
- ESG Configuration (weightings, toggles — see Business Rules)
- Notification Settings

## Data Model

### Master Data

| Model | Purpose | Key Fields |
|---|---|---|
| **Department** | Organizational hierarchy and ESG ownership | Name, Code, Head, Parent Department, Employee Count, Status |
| **Category** | Shared category values across Social & Gamification modules | Name, Type (CSR Activity / Challenge), Status |
| **Emission Factor** | Carbon values used in calculations | Activity Type, Unit, CO₂e per Unit |
| **Product ESG Profile** | ESG information linked to products | — |
| **Environmental Goal** | Sustainability targets | Target Metric, Target Value, Current Value, Deadline |
| **ESG Policy** | Governance policies | Title, Body, Effective Date |
| **Badge** | Employee achievements | Name, Description, Unlock Rule, Icon |
| **Reward** | Redeemable incentives | Name, Description, Points Required, Stock, Status |

### Transactional Data

| Model | Purpose | Key Fields |
|---|---|---|
| **Carbon Transaction** | Stores calculated emissions from ERP operations | Department, Source Type, Quantity, Emission Factor, CO₂e Calculated |
| **CSR Activity** | Social initiatives organized by the company | Title, Category, Points Value, Evidence Required |
| **Employee Participation** | Tracks employee involvement in CSR Activities | Employee, Activity, Proof, Approval Status, Points Earned, Completion Date |
| **Challenge** | Sustainability challenges | Title, Category, Description, XP, Difficulty, Evidence Required, Deadline, Status |
| **Challenge Participation** | Tracks employee progress within Challenges | Challenge, Employee, Progress, Proof, Approval, XP Awarded |
| **Policy Acknowledgement** | Employee policy acceptance | Policy, Employee, Acknowledged At |
| **Audit** | Governance audits | Department, Scope, Date Range, Assigned Auditors |
| **Compliance Issue** | Governance violations | Audit, Severity, Description, Owner, Due Date, Status |
| **Department Score** | Aggregated ESG performance per department | Department, Environmental Score, Social Score, Governance Score, Total Score |

## Business Workflow

```
Master Configuration
   Departments · Categories · Emission Factors · Products
   Goals · Policies · Challenges
        │
        ▼
Daily Business Operations
   (Purchase • Manufacturing • Expenses • Fleet)
        │
        ▼
Carbon Transactions
        │
        ▼
Employee Participation (CSR) · Challenge Participation
Policy Acknowledgements · Audits
        │
        ▼
Environmental Score   Social Score   Governance Score
        │
        ▼
Department Total Score
        │
        ▼
Overall ESG Score
(weighted average of Department Total Scores
 default weighting: Environmental 40% / Social 30% / Governance 30%,
 configurable per organization)
        │
        ▼
Organization Dashboard & Reports
```

## Core Configuration & Business Rules

These are in scope, not optional, since they directly support the core modules:

- **Reward Redemption** — Employees redeem earned Points/XP for a Reward from the catalog, subject to stock availability. Redemption atomically deducts the corresponding points from the employee's balance and decrements stock.
- **Notification System** — Sends in-app and/or email notifications for: new Compliance Issue raised, CSR/Challenge approval decisions, Policy Acknowledgement reminders, and Badge unlocks. Configurable via Settings → Notification Settings.
- **Auto Emission Calculation (toggle)** — When enabled, Carbon Transactions are calculated automatically from linked Purchase/Manufacturing/Expense/Fleet records using the relevant Emission Factor — no manual entry required.
- **Evidence Requirement (toggle)** — When enabled, CSR Activity participation cannot be marked Approved without an attached proof file.
- **Badge Auto-Award (toggle)** — When enabled, a Badge is automatically assigned to an employee the moment their XP, completed-challenge count, or other tracked metric satisfies that Badge's Unlock Rule — no manual admin action required.
- **Compliance Issue Ownership** — Every Compliance Issue must have an assigned Owner and a Due Date. Issues that pass their Due Date while still Open are flagged and feed the Notification System.

## Reports

The platform generates:

- **Environmental Report** — emissions, goals, vendor & product breakdown
- **Social Report** — diversity, CSR participation, training completion
- **Governance Report** — policies, audits, compliance & risk summary
- **ESG Summary Report** — executive overview: all 4 scores + department comparison
- **Custom Report Builder** — combine filters below and export (PDF / Excel / CSV)

Each report supports filtering by:
- Department
- Date Range
- Module
- Employee
- Challenge
- ESG Category

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python), SQLModel / SQLAlchemy |
| **Database** | SQLite (dev) → PostgreSQL (production-ready) |
| **Frontend** | React, Tailwind CSS, Recharts |
| **Auth** | JWT-based authentication, Role-Based Access Control |

## Project Structure

```
EcoSphere_ESG/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLModel entities (master + transactional data)
│   │   ├── routers/         # environmental, social, governance, gamification, reports
│   │   ├── services/        # scoring engine, badge auto-award, emission calculation
│   │   ├── core/            # auth, config, settings toggles
│   │   └── main.py
│   ├── seed_data.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Environmental, Social, Governance, Gamification, Reports, Settings
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173` (frontend) with the API at `http://localhost:8000`.

## User Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access — departments, categories, ESG configuration, all reports |
| **Department Head** | Views/manages department-scoped data, approves department-level activity |
| **Employee** | Submits CSR/Challenge participation, views own XP/badges/leaderboard position, redeems rewards |
| **Auditor** | Creates and runs audit cycles, raises compliance issues |

## Screens & Navigation

Sidebar-driven navigation grouped by module, matching the platform's core structure:

- **Dashboard** — Executive overview: Environmental / Social / Governance / Overall ESG scores, emissions trend, department ranking, recent activity, quick actions
- **Environmental** — Emission Factors, Product ESG Profiles, Carbon Transactions, Environmental Goals
- **Social** — CSR Activities, Employee Participation (approval queue), Diversity Dashboard
- **Governance** — Policies, Policy Acknowledgements, Audits, Compliance Issues
- **Gamification** — Challenges (by lifecycle status), Challenge Participation, Badges, Rewards, Leaderboard
- **Reports** — Environmental / Social / Governance / ESG Summary reports, Custom Report Builder
- **Settings** — Departments, Categories, ESG Configuration (weights & toggles), Notification Settings

---

*EcoSphere_ESG — turning ESG data into ESG intelligence.*
