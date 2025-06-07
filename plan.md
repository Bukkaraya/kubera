# Detailed Design Document for Personal Budgeting Web App  
**(Updated: Simple Auth + Accounts Model for Checking/Savings/Investments)**

---

## 1. System Architecture

### 1.1 Overview

- **Frontend:** React SPA  
- **Backend:** FastAPI REST API  
- **Database:** SQL (PostgreSQL preferred for production, SQLite for local/dev)  
- **Authentication:** Simple username/password authentication with hardcoded credentials in backend config, issuing JWT tokens  
- **Hosting:** TBD (cloud VPS, managed DB, or local server)  

### 1.2 Component Diagram

```
[React Frontend] <---> [FastAPI Backend] <---> [SQL Database]
       |                     |
       |                     +--> Authentication (username/password, JWT)
```

---

## 2. Data Models

### 2.1 User

Since the app is for you and your family only, and authentication is simplified, the **User model can be omitted** or kept minimal if you want to support multiple users later.

If multiple users are desired, a simple User model can be:

| Field          | Type     | Description                      |
|----------------|----------|--------------------------------|
| id             | UUID     | Primary key                    |
| username       | String   | Unique username                |
| password_hash  | String   | Hashed password (bcrypt)       |
| name           | String   | Display name                  |
| created_at     | DateTime | Account creation timestamp     |

For now, you can hardcode a single username and bcrypt-hashed password in environment variables or config.

---

### 2.2 Category

| Field          | Type     | Description                      |
|----------------|----------|--------------------------------|
| id             | UUID     | Primary key                    |
| user_id        | UUID     | Owner user (optional if single user) |
| name           | String   | Category name                  |
| is_predefined  | Boolean  | True if predefined category    |
| created_at     | DateTime | Timestamp                     |

---

### 2.3 Account

| Field          | Type       | Description                          |
|----------------|------------|------------------------------------|
| id             | UUID       | Primary key                        |
| user_id        | UUID       | Owner user (optional if single user) |
| name           | String     | Account name (e.g., "Chase Checking") |
| type           | Enum       | Account type: Checking, Savings, Investment |
| created_at     | DateTime   | Timestamp                         |

---

### 2.4 Transaction

| Field          | Type       | Description                          |
|----------------|------------|------------------------------------|
| id             | UUID       | Primary key                        |
| user_id        | UUID       | Owner user (optional)              |
| account_id     | UUID       | FK to Account                      |
| category_id    | UUID       | FK to Category                    |
| amount         | Decimal    | Positive for income, negative for expense |
| date           | Date       | Transaction date                   |
| notes          | Text       | Optional notes                    |
| payment_method | String     | e.g., Cash, Credit Card            |
| merchant       | String     | Optional merchant name             |
| tags           | JSON Array | List of tags                      |
| created_at     | DateTime   | Timestamp                       |

---

### 2.5 RecurringTransaction

| Field          | Type       | Description                          |
|----------------|------------|------------------------------------|
| id             | UUID       | Primary key                        |
| user_id        | UUID       | Owner user (optional)              |
| account_id     | UUID       | FK to Account                      |
| category_id    | UUID       | FK to Category                    |
| amount         | Decimal    | Amount per occurrence              |
| start_date     | Date       | When recurrence starts             |
| frequency      | Enum       | Daily, Weekly, Monthly, Yearly     |
| notes          | Text       | Optional notes                    |
| payment_method | String     | Payment method                   |
| merchant       | String     | Merchant                        |
| tags           | JSON Array | Tags                           |
| last_generated | Date       | Last date transaction was auto-created |
| active         | Boolean    | Is recurrence active               |
| created_at     | DateTime   | Timestamp                       |

---

### 2.6 Budget

| Field          | Type       | Description                          |
|----------------|------------|------------------------------------|
| id             | UUID       | Primary key                        |
| user_id        | UUID       | Owner user (optional)              |
| category_id    | UUID       | FK to Category (nullable for overall budget) |
| month          | Date       | Month and year (e.g., 2024-06-01) |
| amount         | Decimal    | Budgeted amount                    |
| created_at     | DateTime   | Timestamp                         |

---

## 3. API Design

### 3.1 Authentication Endpoints

| Method | Endpoint  | Description                          |
|--------|-----------|------------------------------------|
| POST   | /login    | Accepts JSON `{username, password}`, returns JWT token if valid |

- The backend verifies the username/password against the hardcoded credentials (password hashed with bcrypt).  
- On success, returns a JWT token signed with a secret key.  
- On failure, returns 401 Unauthorized.

### 3.2 Protected Endpoints

All other endpoints require the `Authorization: Bearer <JWT>` header.

| Method | Endpoint                          | Description                          |
|--------|---------------------------------|------------------------------------|
| GET    | /categories                     | List categories                    |
| POST   | /categories                     | Create category                   |
| GET    | /accounts                       | List accounts                     |
| POST   | /accounts                       | Create account                   |
| PUT    | /accounts/{id}                  | Update account                   |
| DELETE | /accounts/{id}                  | Delete account                   |
| GET    | /transactions                   | List transactions (with filters)  |
| POST   | /transactions                   | Add transaction                   |
| PUT    | /transactions/{id}              | Update transaction                |
| DELETE | /transactions/{id}              | Delete transaction                |
| GET    | /recurring-transactions         | List recurring transactions       |
| POST   | /recurring-transactions         | Create recurring transaction      |
| PUT    | /recurring-transactions/{id}    | Update recurring transaction      |
| DELETE | /recurring-transactions/{id}    | Delete recurring transaction      |
| GET    | /budgets                       | List budgets                     |
| POST   | /budgets                       | Create/update budget             |
| POST   | /import/spreadsheet             | Import transactions/accounts from spreadsheet |

---

## 4. Frontend Components

- **Login Page:**  
  - Username/password form  
  - On submit, call `/login` endpoint  
  - Store JWT token securely (e.g., in memory or localStorage)  
  - Redirect to Dashboard on success  

- **Dashboard:**  
  - Current month spending by category (bar/pie chart)  
  - Overall savings and investments growth over time (line chart)  
  - Quick summary (total income, expenses, savings)  
  - Account balances summary by account type  

- **Accounts Page:**  
  - List all accounts with type and balance  
  - Add/Edit/Delete accounts  

- **Transactions Page:**  
  - List with filters (date range, account, category, tags, merchant)  
  - Add/Edit transaction modal with account selection  

- **Recurring Transactions Page:**  
  - List and manage recurring transactions  

- **Budgets Page:**  
  - Set monthly budgets per category  
  - Visualize budget vs actual spending  

- **Import Page:**  
  - Upload spreadsheet to import transactions and accounts  

---

## 5. Recurring Transaction Processing

- Background task (e.g., FastAPI background tasks or Celery) runs daily  
- Checks for recurring transactions with `last_generated` < today  
- Creates new transactions for each due occurrence linked to the specified account  
- Updates `last_generated` accordingly  

---

## 6. Security Considerations

- Use HTTPS for all communication  
- Store hashed password securely in environment variables or config file (bcrypt recommended)  
- Rate limit login attempts to prevent brute force attacks  
- Use JWT tokens for API authentication  
- Validate and sanitize all inputs  
- Limit API access to authenticated users only  
- Regular backups of database  

---

## 7. Deployment Notes

- Backend: Deploy FastAPI app on cloud VPS or managed service (AWS, DigitalOcean, etc.)  
- Database: PostgreSQL recommended for production, SQLite for local/dev  
- Frontend: React app deployed on static hosting (Netlify, Vercel) or same server as backend  
- Configure environment variables for JWT secret, username, and hashed password  

---

## 8. Example Login Flow

1. User opens app, sees login page  
2. User enters username and password  
3. Frontend sends POST `/login` with credentials  
4. Backend verifies credentials against hardcoded username and bcrypt-hashed password  
5. If valid, backend returns JWT token  
6. Frontend stores token and includes it in `Authorization` header for subsequent API calls  
7. User accesses app features  

---

## 9. Additional Notes

- **Account Balances:**  
  - Can be computed dynamically by summing transactions per account or stored and updated on transaction creation/modification.  
- **Spreadsheet Import:**  
  - Should support importing accounts and transactions with mapping to categories and accounts.  
- **Filtering & Search:**  
  - Transactions can be filtered by date range, account, category, merchant, tags, and payment method.  
- **Budgets:**  
  - Budgets are set per category per month and compared against actual spending in reports.  

---

If you want, I can provide:  
- Sample FastAPI authentication and accounts API code snippets  
- React component examples for login, accounts, and dashboard  
- Database schema SQL scripts  

Would you like me to provide any of these next?

### user

I need you to create an implementation plan for this, this will be the initial prompt for another AI model to create the project. I want it broken down in steps

### assistant

Certainly! Below is a detailed **implementation plan** broken down into clear, sequential steps. This plan can be used as an initial prompt for another AI model or as a roadmap for development.

---

# Implementation Plan for Personal Budgeting Web App

---

## Phase 1: Project Setup & Basic Infrastructure

### Step 1: Initialize Backend Project
- Set up FastAPI project structure  
- Configure environment variables for JWT secret, hardcoded username, and bcrypt-hashed password  
- Set up database connection (PostgreSQL or SQLite) using SQLAlchemy or equivalent ORM  
- Create initial database migration scripts  

### Step 2: Implement Authentication
- Implement `/login` endpoint accepting username/password  
- Validate credentials against hardcoded username and bcrypt-hashed password  
- Generate and return JWT token on successful login  
- Middleware/dependency to validate JWT token on protected endpoints  

### Step 3: Initialize Frontend Project (React + Vite + MUI)
- Set up React project using Vite  
- Install and configure Material-UI (MUI)  
- Install React Router for navigation  
- Set up basic project structure with components, pages, services folders  
- Configure API service layer for HTTP requests  
- **Verification:** Ensure dev server runs and MUI components render correctly  

---

## Phase 2: Core Data Models & APIs

### Step 4: Implement Data Models & Migrations
- Define and create tables for:  
  - Category  
  - Account  
  - Transaction  
  - RecurringTransaction  
  - Budget  
- Implement database migrations  

### Step 5: Implement Category APIs
- CRUD endpoints for categories  
- Seed predefined categories on first run or via migration  

### Step 6: Implement Account APIs
- CRUD endpoints for accounts  
- Validation for account types (checking, savings, investment)  

### Step 7: Implement Transaction APIs
- CRUD endpoints for transactions  
- Support filtering by date range, account, category, merchant, tags, payment method  

### Step 8: Implement Recurring Transaction APIs
- CRUD endpoints for recurring transactions  
- Logic to mark active/inactive  

### Step 9: Implement Budget APIs
- CRUD endpoints for budgets  
- Support monthly budgets per category  

---

## Phase 3: Frontend Core Features (One Feature at a Time)

### Step 10: Authentication UI Setup
- Create login page with MUI components (TextField, Button, Card)  
- Implement JWT token storage in localStorage/sessionStorage  
- Create authentication context/service  
- Set up protected route wrapper  
- Create basic layout with AppBar and navigation drawer  
- **Verification:** Login form renders correctly, can store/retrieve tokens, routing works  

### Step 11: Dashboard Foundation
- Create dashboard page layout using MUI Grid system  
- Add placeholder cards for different sections  
- Implement basic routing to dashboard after login  
- Add logout functionality  
- **Verification:** Dashboard loads, layout is responsive, navigation works  

### Step 12: Categories Management UI
- Create categories page with MUI DataGrid or Table  
- Implement add category modal/dialog with form validation  
- Add edit and delete functionality with confirmation dialogs  
- Connect to category APIs  
- **Verification:** Can list, add, edit, and delete categories successfully  

### Step 13: Accounts Management UI  
- Create accounts page with account type chips/badges  
- Implement add/edit account modal with type selection (Checking/Savings/Investment)  
- Display account balances (initially hardcoded, later calculated)  
- Add delete functionality with confirmation  
- **Verification:** Can manage accounts, types display correctly, CRUD operations work  

### Step 14: Basic Transactions UI
- Create transactions page with MUI DataGrid  
- Implement add transaction modal with account and category dropdowns  
- Add basic filters (date range picker, account selector, category selector)  
- Display transactions in paginated table  
- **Verification:** Can add transactions, filters work, data displays correctly  

### Step 15: Transaction Management Enhancement
- Add edit and delete transaction functionality  
- Implement advanced search (merchant, tags, payment method)  
- Add bulk operations (select multiple, delete multiple)  
- Improve mobile responsiveness  
- **Verification:** Full CRUD works, search filters function properly, mobile-friendly  

### Step 16: Dashboard Charts Implementation
- Install chart library (recharts or mui-x-charts)  
- Implement spending by category chart (pie or bar chart)  
- Add account balances summary cards  
- Create monthly spending trend line chart  
- **Verification:** Charts render with real data, responsive design, proper colors  

### Step 17: Budget Management UI
- Create budgets page with monthly budget cards  
- Implement budget creation/editing modal  
- Show budget vs actual spending progress bars  
- Add budget alerts/warnings when approaching limits  
- **Verification:** Can set budgets, progress indicators work, alerts display correctly  

### Step 18: Recurring Transactions UI
- Create recurring transactions page  
- Implement add/edit recurring transaction modal with frequency selection  
- Show next execution date and status  
- Add toggle for active/inactive status  
- **Verification:** Can manage recurring transactions, frequencies work correctly  

---

## Phase 4: Advanced Features & Polish

### Step 19: Spreadsheet Import UI
- Create import page with file upload component  
- Add preview of imported data before confirmation  
- Show import progress and results  
- Handle error states and validation messages  
- **Verification:** Can upload files, preview data, successful import, error handling works  

### Step 20: Dashboard Enhancement & Analytics
- Add date range selectors for dashboard views  
- Implement export functionality (CSV, PDF)  
- Add more detailed analytics (spending trends, category breakdowns)  
- Implement dark/light theme toggle  
- **Verification:** All dashboard features work, exports generate correctly, themes switch properly  

### Step 21: Mobile Optimization & PWA
- Optimize all pages for mobile devices  
- Add touch-friendly interactions  
- Implement PWA features (service worker, manifest)  
- Add offline capability for viewing data  
- **Verification:** App works on mobile, can be installed as PWA, offline functionality works  

---

## Phase 5: Backend Integration & Data Flow

### Step 22: Recurring Transaction Processing
- Implement background task to run daily  
- Auto-create transactions for due recurring transactions  
- Update `last_generated` field accordingly  
- **Verification:** Recurring transactions generate automatically, data consistency maintained  

### Step 23: Data Synchronization & Real-time Updates
- Implement real-time updates for shared data  
- Add optimistic updates for better UX  
- Handle network errors and retry logic  
- **Verification:** UI updates immediately, handles offline/online states gracefully  

---

## Phase 5: Testing, Security & Deployment

### Step 19: Testing
- Write unit and integration tests for backend APIs  
- Write frontend component and integration tests  
- Test authentication flows and protected routes  

### Step 20: Security Hardening
- Ensure HTTPS is enforced (if applicable)  
- Rate limit login attempts  
- Validate and sanitize all inputs  
- Securely store secrets and environment variables  

### Step 21: Deployment Setup
- Prepare deployment scripts or Dockerfiles for backend and frontend  
- Set up database backups and migrations in deployment environment  
- Deploy backend and frontend to chosen hosting platforms  

---

## Phase 6: Documentation & Handoff

### Step 22: Documentation
- Document API endpoints (e.g., OpenAPI/Swagger)  
- Document environment setup and configuration  
- Document frontend usage and deployment instructions  

### Step 23: Final Review & Handoff
- Review all features and fix bugs  
- Prepare handoff materials for users or future developers  

---

# Notes for the AI Model

- Use JWT for stateless authentication with hardcoded credentials stored securely  
- Use React for frontend with responsive design  
- Use SQL database with ORM for data persistence  
- Background tasks can be implemented using FastAPI’s built-in background tasks or Celery  
- Charts can be implemented using popular React chart libraries (e.g., Recharts, Chart.js)  
- Keep UI simple and user-friendly, focusing on core budgeting features first  

---