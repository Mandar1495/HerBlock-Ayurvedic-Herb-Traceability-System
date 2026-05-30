"""
HerBlock — Seed Script
======================
Creates realistic demo data in MongoDB for presentation/testing.

Usage:
    cd backend
    python seed.py

This creates:
 - 2 demo users (farmer, manufacturer, lab_tester, aggregator)
 - 3 herb collection events (Ashwagandha, Tulsi, Brahmi) — GPS validated
 - 2 processing steps
 - 3 quality tests (all PASS)
 - 1 final product with QR code
 - 1 blockchain transaction per event

The main demo trace URL will be: /trace/ASHWA-TRACE-001
"""

import asyncio
import os
import sys
import uuid
import hashlib
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

# Fix Unicode output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'herblock')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def calculate_hash(data: dict) -> str:
    data_string = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(data_string.encode()).hexdigest()

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("🌱 Starting HerBlock seed...")

    # ─────────────────────────────────────────────
    #  Clear existing demo data
    # ─────────────────────────────────────────────
    for collection in ['users', 'collection_events', 'processing_steps',
                       'quality_tests', 'products', 'blockchain_transactions', 'collectors']:
        await db[collection].delete_many({})
    print("🗑️  Cleared existing data")

    now = datetime.now(timezone.utc)

    # ─────────────────────────────────────────────
    #  1. USERS
    # ─────────────────────────────────────────────
    users = [
        {"username": "farmer1",      "hashed_password": pwd_context.hash("admin123"), "role": "farmer",       "full_name": "Raju Patel"},
        {"username": "manufacturer1","hashed_password": pwd_context.hash("admin123"), "role": "manufacturer", "full_name": "Himalaya Drugs"},
        {"username": "lab1",         "hashed_password": pwd_context.hash("admin123"), "role": "lab_tester",   "full_name": "NABL Lab Mumbai"},
        {"username": "aggregator1",  "hashed_password": pwd_context.hash("admin123"), "role": "aggregator",   "full_name": "Green Agri Traders"},
        {"username": "admin",        "hashed_password": pwd_context.hash("admin123"), "role": "farmer",       "full_name": "HerBlock Admin"},
    ]
    await db.users.insert_many(users)
    print(f"👥 Created {len(users)} users  (username/password: admin / admin123)")

    # ─────────────────────────────────────────────
    #  2. MOBILE COLLECTORS
    # ─────────────────────────────────────────────
    from passlib.context import CryptContext
    pin_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    collectors = [
        {"collector_id": "COL-001", "name": "Ramesh Kumar",  "pin_hash": pin_ctx.hash("1234"), "region": "Madhya Pradesh", "total_collections": 15, "created_at": now},
        {"collector_id": "COL-002", "name": "Priya Sharma",  "pin_hash": pin_ctx.hash("1234"), "region": "Rajasthan",      "total_collections": 8,  "created_at": now},
    ]
    await db.collectors.insert_many(collectors)
    print(f"📱 Created {len(collectors)} mobile collectors  (PIN: 1234)")

    # ─────────────────────────────────────────────
    #  3. COLLECTION EVENTS
    # ─────────────────────────────────────────────
    collections = [
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",
            "collector_id": "COL-001",
            "collector_name": "Ramesh Kumar",
            "species_name": "Ashwagandha",
            "latitude": 23.2599,
            "longitude": 77.4126,
            "location_name": "Bhopal",
            "district": "Bhopal",
            "state": "Madhya Pradesh",
            "quantity_kg": 125.5,
            "quality_grade": "A",
            "weather_conditions": "Partly cloudy, 24°C",
            "organic_certified": True,
            "geo_validated": True,
            "geo_validation_detail": {"valid": True, "distance_km": 420.5, "max_radius_km": 1800},
            "blockchain_hash": "",
            "harvest_date": now - timedelta(days=15),
            "timestamp": now - timedelta(days=15),
        },
        {
            "id": str(uuid.uuid4()),
            "product_id": "TULSI-TRACE-001",
            "collector_id": "COL-002",
            "collector_name": "Priya Sharma",
            "species_name": "Tulsi",
            "latitude": 26.8467,
            "longitude": 80.9462,
            "location_name": "Lucknow",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "quantity_kg": 85.0,
            "quality_grade": "A",
            "weather_conditions": "Sunny, 28°C",
            "organic_certified": True,
            "geo_validated": True,
            "geo_validation_detail": {"valid": True, "distance_km": 310.2, "max_radius_km": 1500},
            "blockchain_hash": "",
            "harvest_date": now - timedelta(days=12),
            "timestamp": now - timedelta(days=12),
        },
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",   # Second batch for same product
            "collector_id": "COL-001",
            "collector_name": "Ramesh Kumar",
            "species_name": "Ashwagandha",
            "latitude": 25.4358,
            "longitude": 74.6393,
            "location_name": "Bhilwara",
            "district": "Bhilwara",
            "state": "Rajasthan",
            "quantity_kg": 60.0,
            "quality_grade": "B",
            "weather_conditions": "Clear, 22°C",
            "organic_certified": False,
            "geo_validated": True,
            "geo_validation_detail": {"valid": True, "distance_km": 615.0, "max_radius_km": 1800},
            "blockchain_hash": "",
            "harvest_date": now - timedelta(days=13),
            "timestamp": now - timedelta(days=13),
        },
    ]
    for c in collections:
        c["blockchain_hash"] = calculate_hash({k: v for k, v in c.items() if k != "blockchain_hash"})
    await db.collection_events.insert_many(collections)
    print(f"🌿 Created {len(collections)} collection events")

    # ─────────────────────────────────────────────
    #  4. PROCESSING STEPS
    # ─────────────────────────────────────────────
    processing = [
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",
            "source_collection_id": collections[0]["id"],
            "facility_id": "FAC-001",
            "facility_name": "Himalaya Processing Unit",
            "facility_location": "Dehradun, Uttarakhand",
            "process_type": "drying",
            "equipment_used": "Solar Tunnel Dryer",
            "operator_name": "Suresh Nair",
            "input_quantity_kg": 185.5,
            "output_quantity_kg": 92.0,
            "batch_number": "BATCH-DRY-001",
            "gmp_certified": True,
            "ayush_license": "AYUSH/2024/MH/001",
            "blockchain_hash": "",
            "processing_date": now - timedelta(days=10),
            "timestamp": now - timedelta(days=10),
        },
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",
            "source_collection_id": collections[0]["id"],
            "facility_id": "FAC-001",
            "facility_name": "Himalaya Processing Unit",
            "facility_location": "Dehradun, Uttarakhand",
            "process_type": "grinding",
            "equipment_used": "Pulverizer Mill 40-mesh",
            "operator_name": "Suresh Nair",
            "input_quantity_kg": 92.0,
            "output_quantity_kg": 88.5,
            "batch_number": "BATCH-GRD-001",
            "gmp_certified": True,
            "ayush_license": "AYUSH/2024/MH/001",
            "blockchain_hash": "",
            "processing_date": now - timedelta(days=8),
            "timestamp": now - timedelta(days=8),
        },
    ]
    for p in processing:
        p["blockchain_hash"] = calculate_hash({k: v for k, v in p.items() if k != "blockchain_hash"})
    await db.processing_steps.insert_many(processing)
    print(f"⚙️  Created {len(processing)} processing steps")

    # ─────────────────────────────────────────────
    #  5. QUALITY TESTS
    # ─────────────────────────────────────────────
    quality_tests = [
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",
            "lab_id": "LAB-NABL-001",
            "lab_name": "NABL Accredited Lab Mumbai",
            "test_type": "moisture",
            "test_result": "Moisture content: 7.8% (IS specification: ≤8.0%) — WITHIN LIMITS",
            "pass_fail": "PASS",
            "tested_by": "Dr. Anjali Mehta",
            "certificate_number": "NABL/2024/ASHWA/001",
            "accreditation_number": "NABL-TC-6578",
            "blockchain_hash": "",
            "test_date": now - timedelta(days=6),
            "timestamp": now - timedelta(days=6),
        },
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",
            "lab_id": "LAB-NABL-001",
            "lab_name": "NABL Accredited Lab Mumbai",
            "test_type": "heavy_metals",
            "test_result": "Pb: 0.3 ppm (limit 10 ppm), Cd: 0.05 ppm (limit 0.3 ppm), As: 0.1 ppm (limit 3 ppm) — ALL WITHIN WHO/FSSAI LIMITS",
            "pass_fail": "PASS",
            "tested_by": "Dr. Anjali Mehta",
            "certificate_number": "NABL/2024/ASHWA/002",
            "accreditation_number": "NABL-TC-6578",
            "blockchain_hash": "",
            "test_date": now - timedelta(days=5),
            "timestamp": now - timedelta(days=5),
        },
        {
            "id": str(uuid.uuid4()),
            "product_id": "ASHWA-TRACE-001",
            "lab_id": "LAB-NABL-001",
            "lab_name": "NABL Accredited Lab Mumbai",
            "test_type": "pesticide",
            "test_result": "Organochlorine: ND, Organophosphate: ND, Pyrethroid: ND — NO PESTICIDE RESIDUES DETECTED",
            "pass_fail": "PASS",
            "tested_by": "Dr. Anjali Mehta",
            "certificate_number": "NABL/2024/ASHWA/003",
            "accreditation_number": "NABL-TC-6578",
            "blockchain_hash": "",
            "test_date": now - timedelta(days=4),
            "timestamp": now - timedelta(days=4),
        },
    ]
    for t in quality_tests:
        t["blockchain_hash"] = calculate_hash({k: v for k, v in t.items() if k != "blockchain_hash"})
    await db.quality_tests.insert_many(quality_tests)
    print(f"🔬 Created {len(quality_tests)} quality tests")

    # ─────────────────────────────────────────────
    #  6. FINAL PRODUCT
    # ─────────────────────────────────────────────
    product = {
        "id": "ASHWA-TRACE-001",
        "product_id": "ASHWA-TRACE-001",
        "product_name": "Ashwagandha Root Powder",
        "product_name_hindi": "अश्वगंधा चूर्ण",
        "batch_id": "ASHWA-TRACE-001",
        "batch_number": "ASHWA-TRACE-001",
        "species_name": "Ashwagandha",
        "manufacturer": "Himalaya Drug Company",
        "manufacturer_name": "Himalaya Drug Company",
        "manufacturer_id": "MFG-HIM-001",
        "ayush_license": "AYUSH/2024/UK/DRG/00142",
        "fssai_license": "FSSAI/2024/UK/00087",
        "final_quantity_kg": 88.5,
        "quantity_kg": 88.5,
        "manufacturing_date": (now - timedelta(days=3)).isoformat(),
        "expiry_date": (now + timedelta(days=730)).isoformat(),
        "mrp": 450.0,
        "certifications": ["Organic", "GMP", "AYUSH", "NABL Tested"],
        "ingredients": ["Ashwagandha root extract (Withania somnifera)", "No additives"],
        "source_collections": [c["id"] for c in collections if c["product_id"] == "ASHWA-TRACE-001"],
        "processing_ids": [p["id"] for p in processing],
        "quality_test_ids": [t["id"] for t in quality_tests],
        "blockchain_hash": "",
        "timestamp": now - timedelta(days=2),
    }
    product["blockchain_hash"] = calculate_hash({k: v for k, v in product.items() if k != "blockchain_hash"})
    await db.products.insert_one(product)
    print("📦 Created product: ASHWA-TRACE-001 (Ashwagandha Root Powder)")

    # ─────────────────────────────────────────────
    #  7. BLOCKCHAIN TRANSACTIONS
    # ─────────────────────────────────────────────
    all_events = collections + processing + quality_tests + [product]
    prev_hash = "0" * 64
    txs = []
    for i, event in enumerate(all_events):
        tx_id = str(uuid.uuid4())
        data_hash = event.get("blockchain_hash", calculate_hash(event))
        block_hash = hashlib.sha256(f"{prev_hash}{data_hash}{tx_id}".encode()).hexdigest()
        tx = {
            "tx_id": tx_id,
            "product_id": event.get("product_id", event.get("id", "UNKNOWN")),
            "event_type": (
                "collection" if event in collections else
                "processing" if event in processing else
                "quality_test" if event in quality_tests else
                "product"
            ),
            "data_hash": data_hash,
            "block_hash": block_hash,
            "previous_hash": prev_hash,
            "block_number": i + 1,
            "channel": "herblock",
            "endorsers": ["Org1MSP", "Org2MSP"],
            "timestamp": event.get("timestamp", now),
        }
        txs.append(tx)
        prev_hash = block_hash

    await db.blockchain_transactions.insert_many(txs)
    print(f"🔗 Created {len(txs)} blockchain transactions")

    # ─────────────────────────────────────────────
    #  Summary
    # ─────────────────────────────────────────────
    print("\n" + "="*55)
    print("✅ Seed complete!")
    print("="*55)
    print(f"📊 MongoDB: {DB_NAME} @ {MONGO_URL}")
    print()
    print("🔐 Login credentials (all use password: admin123)")
    print("   admin        → Farmer Dashboard")
    print("   farmer1      → Farmer Dashboard")
    print("   aggregator1  → Aggregator Dashboard")
    print("   manufacturer1→ Manufacturer Dashboard")
    print("   lab1         → Lab Dashboard")
    print()
    print("📱 Mobile collector PIN: 1234")
    print("   COL-001 (Ramesh Kumar) or COL-002 (Priya Sharma)")
    print()
    print("🔍 Demo Trace URL:")
    print("   http://localhost:3000/trace/ASHWA-TRACE-001")
    print("="*55)

    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
