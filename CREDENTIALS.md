# HRMS Seeded Credentials

Run `cd backend && npm run db:seed` to populate the database.

---

## 🔴 Admin Account

| Field    | Value                   |
|----------|-------------------------|
| Email    | `admin@company.com`     |
| Password | `password123`           |
| Role     | ADMIN                   |
| Emp ID   | EMP-001                 |
| Name     | Gokulnath Senthil       |

---

## 🟠 Manager Accounts

| Email                    | Password        | Role    | Emp ID  | Name               | Department       |
|--------------------------|-----------------|---------|---------|--------------------|-----------------|
| `manager@company.com`    | `Manager@2026`  | MANAGER | EMP-002 | Priya Ramachandran | Engineering      |
| `hr.manager@company.com` | `HrManager@26`  | MANAGER | EMP-003 | Meenakshi Sundaram | Human Resources  |

---

## 🟢 Employee Accounts (USER role)

| Email                     | Password   | Emp ID  | Name                  | Department   | Designation              |
|---------------------------|------------|---------|----------------------|-------------|-------------------------|
| `emp001@company.com`      | `Emp@001`  | EMP-004 | Arjun Krishnamurthy  | Engineering  | Senior Frontend Engineer |
| `emp002@company.com`      | `Emp@002`  | EMP-005 | Sneha Iyer           | Engineering  | Backend Engineer         |
| `emp003@company.com`      | `Emp@003`  | EMP-006 | Rajan Venkatesh      | Engineering  | DevOps Engineer          |
| `emp004@company.com`      | `Emp@004`  | EMP-007 | Ananya Patel         | Product      | Product Manager          |
| `emp005@company.com`      | `Emp@005`  | EMP-008 | Kiran Shankar        | HR           | HR Executive             |
| `emp006@company.com`      | `Emp@006`  | EMP-009 | Pooja Reddy          | Finance      | Financial Analyst        |
| `emp007@company.com`      | `Emp@007`  | EMP-010 | Manoj Kumar          | Engineering  | QA Engineer              |
| `emp008@company.com`      | `Emp@008`  | EMP-011 | Divya Subramaniam    | Design       | UI/UX Designer           |

---

## 🔐 Security Notes

- All passwords are **bcrypt-hashed** (12 rounds) in the database — never stored in plain text
- Passwords listed above are for **development/demo only** — change before production
- The `azureId` field is set for SSO path; email+password path uses `passwordHash`
- Each employee has a **unique** `employeeId` (EMP-XXX) and `employeeCode` (HRMS-XXXX)
- New employees added via the HR portal get auto-generated codes from the backend

---

## 🚀 Quick Start

```bash
# Backend
cd backend
cp ../.env.example .env        # fill DATABASE_URL & JWT_SECRET
npm install
npx prisma migrate dev         # run migrations
npm run db:seed                # seed all accounts above
npm run start:dev              # starts on :3001

# Frontend
cd frontend
npm install
npm run dev                    # starts on :3000
```
