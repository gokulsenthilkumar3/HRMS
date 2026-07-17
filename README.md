# VaultIQ: Enterprise Asset & Operations Hub V2.0

![VaultIQ Banner](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20|%20NestJS%20|%20PostgreSQL-blue?style=for-the-badge)
![Real-Time](https://img.shields.io/badge/RealTime-WebSockets-orange?style=for-the-badge)

**VaultIQ** is a next-generation Office Asset Management system designed for modern enterprise scale. It combines high-fidelity 3D visualization, AI-driven predictive maintenance, and cryptographic audit trails into a single, unified operations dashboard.

---

## 🚀 Key Innovations

### 🌐 Digital Twin Engine
Real-time 3D synchronization for physical assets powered by **Three.js** and **React Three Fiber**. Every server, laptop, and workstation is represented as a high-fidelity digital twin that reflects its live IoT telemetry and health status. Includes:
- **Pathfinding & Wayfinding:** Visual data packet trajectories flowing to active components.
- **Thermal Heatmaps:** Dynamic neon bloom effects (`EffectComposer`) that change color based on server temperatures.

### ⚡ Real-Time Telemetry & WebSockets
The dashboard UI is no longer static. We've introduced `socket.io` mapped to `@nestjs/websockets` on the backend.
- Global Power Draw metrics dynamically update in real-time.
- System Status automatically triggers `WARNING` modes and visual heatmaps if thermal metrics exceed safety margins.

### 🤖 AI Lifecycle Assistant
Powered by an integrated LLM/ML service, the VaultIQ Assistant provides predictions on asset failure probabilities based on age, telemetry, and maintenance history.
- **Webhook Integration:** Triggers automated Slack/Teams alerts when critical anomalies are detected.

### 🔗 Blockchain Audit Trail
Every change of custody or maintenance record is cryptographically anchored to an immutable ledger (SHA-256), ensuring total compliance and a tamper-proof history of every asset. Manual log entries are strictly prohibited to enforce zero-trust integrity.

### 🛡️ Enterprise Security & Compliance
- **API Rate Limiting:** Enforced via `@nestjs/throttler` (100 RPM limit).
- **Field-Level RBAC:** A dynamic interceptor strips sensitive cryptographic and financial fields from non-admin queries.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Visualization**: Three.js + Framer Motion (Digital Twin Engine & Animations)
- **Styling**: Vanilla CSS + Glassmorphism Design System + JetBrains Mono Typography
- **Charts**: Recharts (ESG & Power Draw metrics)

### Backend (Microservices)
- **Core**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **WebSockets**: Socket.io / NestJS WebSockets
- **Security**: JWT Auth + Field-Level RBAC Guards

---

## 📦 Project Structure

```text
├── frontend/             # Next.js Application
│   ├── app/              # App Router Pages
│   ├── components/       # UI & 3D Components
│   └── styles/           # Global Design Tokens
├── backend/              # NestJS Microservices
│   ├── src/
│   │   ├── assets/       # Inventory Logic
│   │   ├── telemetry/    # WebSockets & Webhooks
│   │   ├── blockchain/   # Immutable Audit Service
│   │   └── maintenance/  # Predictive Engine
│   └── prisma/           # Database Schema
└── vaultiq_innovations.md # Advanced Feature Specs
```

---

## 🚦 Getting Started

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/gokulsenthilkumar3/HRMS.git
   ```

2. **Environment Setup**:
   Create a `.env` file in the root and backend directories with your `DATABASE_URL`.

3. **Install Dependencies**:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

4. **Run Development Servers**:
   ```bash
   # In separate terminals
   npm run dev (frontend)
   npm run start:dev (backend)
   ```

---

## 📄 License
Enterprise Proprietary. Built with ⚡ by **me**.
