# 🌿 HerBlock — Ayurvedic Herb Traceability System

> GPS-validated, blockchain-powered supply chain traceability for Ayurvedic herbs

---

## 🏗️ Project Structure

```
SIH-blockchain/
├── backend/              FastAPI Python server
│   ├── server.py         Main API (1350+ lines)
│   ├── seed.py           Demo data seed script
│   ├── setup_fabric.sh   Hyperledger Fabric network setup
│   ├── services/
│   │   └── fabric_service.py  Fabric CLI integration
│   └── fabric_config/
│       └── chaincode/herblock/herblock.go  Smart contract (Go)
│
├── frontend/             React Web Dashboard
│   └── src/
│       ├── app.js        Router + Auth context
│       ├── AuthCallback.js  Google OAuth handler
│       └── pages/dashboards/
│           ├── FarmerDashboard.jsx
│           ├── AggregatorDashboard.jsx
│           ├── ManufacturerDashboard.jsx
│           └── LabDashboard.jsx
│
└── mobile-app/           Expo React Native Collector App
    ├── app.json          API URL config (extra.apiUrl)
    └── src/
        ├── screens/      Login, Home, Collect, Pending, History, Settings
        ├── database/db.js  SQLite local storage
        └── services/api.js  Backend API client
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirement.txt
python seed.py                                          # Load demo data
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**API Docs:** `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend && npm install && npm start
```

### 3. Mobile App

```bash
cd mobile-app
npm install
# Edit app.json → extra.apiUrl → set your PC's local IP:8000
npx expo start
```

---

## 🔐 Demo Credentials

| Role | Username | Password |
|---|---|---|
| Farmer | `admin` | `admin123` |
| Aggregator | `aggregator1` | `admin123` |
| Manufacturer | `manufacturer1` | `admin123` |
| Lab Tester | `lab1` | `admin123` |

**Mobile Collector PIN:** `1234` · IDs: `COL-001`, `COL-002`

---

## 🔍 Demo Trace URL

```
http://localhost:3000/trace/ASHWA-TRACE-001
```

Full Ashwagandha supply chain: GPS collection → Drying → Grinding → 3 Lab Tests (all PASS) → Final Product.

---

## ⛓️ Hyperledger Fabric Setup (Optional)

Without Fabric, all data falls back to MongoDB (fully functional for demo).

```bash
cd backend
chmod +x setup_fabric.sh
./setup_fabric.sh
```

---

## 📱 System Flow

```
Collector (Mobile) → GPS + Photo → POST /api/collection
                                      └── Haversine GPS Validation (Patent)
                                      └── SHA-256 hash → MongoDB + Blockchain TX
Aggregator (Web)   → Log Batch Receipt → POST /api/processing
Manufacturer (Web) → Processing Steps + Final Product → QR Code Generated
Lab Tester (Web)   → Quality Tests (PASS/FAIL) → Immutable Record
Consumer           → Scan QR → /trace/BATCH_ID → Full verified chain
```

---

## 🔬 Innovative Features

| Claim | Feature | Implementation |
|---|---|---|
| 1 | GPS Geo-Fence Validation | Haversine formula, 5 herb zones |
| 2 | Immutable Records | SHA-256 per event, Merkle tree root |
| 3 | Multi-Org Consensus | Org1 (Farmer) + Org2 (Processor) endorsement |

---

**© 2026 HerBlock India · Built on Hyperledger Fabric**
