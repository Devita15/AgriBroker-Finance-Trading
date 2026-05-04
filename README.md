# Farm ERP - Node.js Backend

## Complete Farm Procurement ERP System

### Features Implemented (Devita's Tasks)

#### Phase 1: Project Setup (B-01)
- Express.js server with proper structure
- ESLint, Prettier configured
- Environment variables management

#### Phase 2: Database Schema (B-02)
- Complete MongoDB schemas for all entities
- Users, Vendors, Farmers, Purchases, Payments
- Ledger entries, Expenses, Inventory, Sales
- Audit logs with immutable design

#### Phase 3: JWT Authentication (B-03, B-05)
- Register/Login endpoints
- JWT token generation with bcrypt
- Refresh token mechanism
- Session management

#### Phase 4: Role-Based Middleware (B-04)
- SuperAdmin, Operator, Vendor roles
- Route protection based on roles
- Data isolation for vendors

#### Phase 5: Farmer Management (B-06, B-07, B-08)
- Full CRUD operations for farmers
- Auto-computed statistics
- Advance management system

#### Phase 6: Ledger Engine (B-09, B-10)
- Auto-posting ledger entries
- Running balance calculation
- Farmer, Expense, Combined ledgers

#### Phase 7: Audit Log Engine (B-11)
- Universal audit logging
- Immutable audit records
- Complete action tracking

### Setup Instructions

1. Install dependencies:
```bash
npm install