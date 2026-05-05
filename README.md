# 🌾 Farm Procurement ERP — Backend API

Complete Node.js + Express + MongoDB backend for the 14-phase Farm ERP system.

---

## 📁 Project Structure

```
farm-erp/
├── src/
│   ├── app.js                    ← Entry point
│   ├── config/
│   │   ├── database.js           ← MongoDB connection
│   │   ├── logger.js             ← Winston logger
│   │   └── swagger.js            ← Swagger config
│   ├── controllers/
│   │   ├── authController.js     ← Registration, login, tokens
│   │   ├── farmerController.js   ← Phase 1 & 8 — Farmer + Ledger
│   │   ├── purchaseController.js ← Phase 2–6 — Purchase flow
│   │   ├── paymentController.js  ← Phase 7 — Farmer payments
│   │   ├── expenseController.js  ← Phase 9 — Expenses + approval
│   │   ├── inventoryController.js← Phase 10 — Stock management
│   │   ├── saleController.js     ← Phase 11 — Sales & invoices
│   │   ├── reportController.js   ← Phases 12–13 — P&L & Reports
│   │   └── auditController.js    ← Phase 14 — Audit log
│   ├── middleware/
│   │   ├── auth.js               ← JWT authentication
│   │   ├── roleCheck.js          ← Role-based access control
│   │   ├── validation.js         ← express-validator rules
│   │   ├── auditLogger.js        ← Immutable audit log middleware
│   │   └── errorHandler.js       ← Global error handler
│   ├── models/
│   │   ├── User.js               ← SuperAdmin / Operator
│   │   ├── Farmer.js             ← Farmer registration
│   │   ├── Purchase.js           ← Purchase header + lines
│   │   ├── Payment.js            ← Farmer payments
│   │   ├── Ledger.js             ← Farmer running ledger
│   │   ├── Expense.js            ← Business expenses
│   │   ├── Inventory.js          ← Real-time stock
│   │   ├── Sale.js               ← Sales invoices
│   │   └── AuditLog.js           ← Immutable audit trail
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── farmerRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── reportRoutes.js
│   │   └── auditRoutes.js
│   └── utils/
│       └── seed.js               ← Seed initial SuperAdmin
├── logs/                         ← Winston log files (auto-created)
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Seed SuperAdmin
```bash
npm run seed
# Creates admin@farmerp.com / Admin@1234
```

### 4. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 🔗 API Base URL
```
http://localhost:5000/api
```

## 📖 Swagger Documentation
```
http://localhost:5000/api/docs
```

## 🏥 Health Check
```
http://localhost:5000/health
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| POST   | /auth/register     | Register new user              |
| POST   | /auth/login        | Login → get access + refresh   |
| POST   | /auth/refresh      | Get new access token           |
| POST   | /auth/logout       | Invalidate session 🔒          |
| GET    | /auth/me           | Get profile 🔒                 |
| PUT    | /auth/me           | Update profile 🔒              |

### Farmers (Phase 1 & 8)
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /farmers                    | Register farmer 🔒       |
| GET    | /farmers                    | List all farmers 🔒      |
| GET    | /farmers/:id                | Get farmer 🔒            |
| PUT    | /farmers/:id                | Update farmer 🔒         |
| PATCH  | /farmers/:id/deactivate     | Deactivate farmer 🔒     |
| GET    | /farmers/:id/ledger         | Farmer ledger 🔒         |

### Purchases (Phases 2–6)
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /purchases            | Create purchase 🔒       |
| GET    | /purchases            | List all purchases 🔒    |
| GET    | /purchases/summary    | Purchase summary 🔒      |
| GET    | /purchases/:id        | Get purchase detail 🔒   |

### Payments (Phase 7)
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /payments                         | Record payment 🔒        |
| GET    | /payments/purchase/:purchaseId    | Payments by purchase 🔒  |
| GET    | /payments/farmer/:farmerId        | Payments by farmer 🔒    |
| PATCH  | /payments/:id/cheque-status       | Update cheque status 🔒  |

### Expenses (Phase 9)
| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| POST   | /expenses                   | Log expense 🔒                 |
| GET    | /expenses                   | List all expenses 🔒           |
| GET    | /expenses/summary           | Summary by category 🔒         |
| GET    | /expenses/:id               | Get expense 🔒                 |
| PATCH  | /expenses/:id/approve       | Approve expense 🔒             |
| PATCH  | /expenses/:id/reject        | Reject expense 🔒              |
| PATCH  | /expenses/:id/cancel        | Cancel expense 🔒              |

### Inventory (Phase 10)
| Method | Endpoint                             | Description              |
|--------|--------------------------------------|--------------------------|
| GET    | /inventory                           | All stock 🔒             |
| GET    | /inventory/product/:productName      | Stock by product 🔒      |
| POST   | /inventory/adjust                    | Manual adjustment 🔒     |
| POST   | /inventory/transfer                  | Warehouse transfer 🔒    |

### Sales (Phase 11)
| Method | Endpoint     | Description              |
|--------|--------------|--------------------------|
| POST   | /sales       | Create sale/invoice 🔒   |
| GET    | /sales       | List all sales 🔒        |
| GET    | /sales/:id   | Get sale detail 🔒       |

### Reports (Phases 12–13)
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /reports/dashboard              | Dashboard summary 🔒     |
| GET    | /reports/profit-loss            | P&L report 🔒            |
| GET    | /reports/farmer/:farmerId       | Farmer report 🔒         |
| GET    | /reports/products               | Product report 🔒        |

### Audit (Phase 14)
| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| GET    | /audit          | Audit logs 🔒            |
| GET    | /audit/:id      | Get single log entry 🔒  |

🔒 = Requires Bearer token

---

## 🏗️ Key Design Decisions

### Pricing Types (Phase 3)
| Type    | Formula                                |
|---------|----------------------------------------|
| kg      | bags × weightPerBag → billedQty × rate |
| quintal | qty × rate/quintal                     |
| piece   | count × rate/piece                     |
| bunch   | count × rate/bunch                     |
| crate   | count × rate/crate                     |
| dozen   | count × rate/dozen                     |
| flat    | single agreed price                    |

### Expense Approval (Phase 9)
| Amount            | Approver     | SLA        |
|-------------------|--------------|------------|
| < Rs 1,000        | Auto-approved| Instant    |
| Rs 1,000–9,999    | Operator     | 24 hours   |
| >= Rs 10,000      | SuperAdmin   | 48 hours   |

### Transactions
All write operations that affect multiple collections (purchase, payment, sale) use **MongoDB transactions** to ensure atomicity.

### Audit Log
The `AuditLog` collection is **immutable** — pre-save hooks block all `findOneAndUpdate`, `updateOne`, and `updateMany` operations, making the log tamper-proof even for SuperAdmin.

---

## 🔐 Security
- **JWT** access tokens (15m) + refresh tokens (7d)
- **bcrypt** password hashing (12 rounds)
- **Helmet** HTTP security headers
- **Rate limiting** — 200 req/15min globally, 20/15min on login
- **Role-based access** on every protected endpoint
- **express-validator** input sanitisation on all routes