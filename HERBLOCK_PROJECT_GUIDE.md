# 🌿 HerBlock: Ayurvedic Herb Traceability System
### 🎓 Comprehensive Project Guide & Teacher Demonstration Manual

---

## 🌟 Section 1: Project Overview (What is HerBlock?)
**HerBlock** is an enterprise-grade supply chain traceability system designed specifically for the **Ayurvedic Herb industry**. 

### 1. The Core Problem It Solves:
* **Herb Adulteration & Substitution:** The Ayurvedic market is plagued by low-quality, substituted, or artificially colored herbs.
* **Lack of Origin Proof:** Once an herb is powdered or converted to a tablet, it is virtually impossible to prove where it was grown, when it was harvested, or whether it was dried and stored under correct conditions.
* **Paper-Based Fraud:** Traditional quality certificates (like moisture levels or pesticide reports) are paper-based and can easily be forged or altered.

### 2. The Solution (HerBlock):
HerBlock provides an end-to-end, digital, **immutable** traceability map from the moment an herb is harvested in the wild or on a farm, through processing and lab testing, to the final packaged consumer product.

### 3. Multi-Stakeholder Flow:
```
[Collector/Farmer Mobile App] ──(1. GPS + Live Photo)──> [Aggregator Dashboard]
                                                                  │
                                                        (2. Batches & Drying)
                                                                  │
                                                                  ▼
[Consumer Public Trace Page] <──(5. QR Scan & Verify)── [Manufacturer / Lab Dashboards]
```

* **Farmer / Field Collector (Mobile App):** Records the raw collection of herbs, capturing GPS coordinates and live photos.
* **Aggregator (Web Portal):** Groups raw collections into processing batches, recording drying, grinding, and weight-change steps.
* **Lab Tester / Quality Control (Web Portal):** Performs tests (Moisture Content, Pesticides, Heavy Metals, Chemical Content) and records them. If a test fails, the batch is locked out.
* **Manufacturer (Web Portal):** Packs the herb, generates a final Product ID, and prints a **secure QR Code**.
* **Consumer:** Scans the QR Code on the product packaging and instantly views the complete, verified, and unalterable history of that specific batch.

---

## 🔄 Section 2: Without Blockchain vs. After Blockchain Connects

Your project features a **hybrid resilient architecture**. It is designed to run in two states: **Simulated Fallback Mode** (offline/database-only) and **Enterprise Blockchain Mode** (blockchain-connected). 

Here is exactly what happens in both scenarios:

### 1. 📂 Without Blockchain (Fallback / MongoDB Mode)
* **What happens:** The system uses **MongoDB** as its primary operational cache. All collections, processing logs, lab tests, and user profiles are successfully stored in MongoDB.
* **Simulated Ledger:** The backend automatically calculates a **cryptographic SHA-256 digital fingerprint (hash)** for every event and links them together like a chain (simulating blocks via a Merkle root in the database).
* **UI Indicator:** The frontend displays **"Demo Mode"** on the dashboard status card. All transactions are listed, but they are flagged as "Locally Verified" instead of "Blockchain Committed".
* **Why this is important:** It ensures that even if you are in a presentation room with no internet or if Docker containers are stopped, the entire application, database, and dashboards **still function flawlessly** for a live demonstration!

### 2. ⛓️ After Blockchain Connects (Hyperledger Fabric Mode)
* **What happens:** When the backend server starts, it checks if the **Hyperledger Fabric Docker containers** are running. If they are, it establishes a live gateway connection.
* **Dual-Write Architecture:** When an event is recorded (e.g., a farmer records a collection on the mobile app):
  1. The data is saved to **MongoDB** (for fast queries and frontend loading).
  2. The exact same data is compiled into a transaction and sent to **Hyperledger Fabric**.
  3. The blockchain smart contract (written in Go) validates the location and signs the block.
  4. Hyperledger returns a unique **Fabric Transaction ID (TxID)**.
  5. The backend marks the database record as `blockchain_verified = true` and updates it with the `fabric_tx_id`.
* **UI Indicator:** The status panel glows **green**, showing **"Connected"**. Every collection and batch gets a glowing **"Verified ✅"** badge with its real block height and peer signature details.
* **Unbreakable Security:** Even if someone manually hacks the MongoDB database and alters a record, the public trace page will instantly detect the mismatch because the **true data** is stored in the immutable Hyperledger ledger!

---

## ⛓️ Section 3: Blockchain in Detail (For HerBlock)

If the teacher asks you, *"What blockchain are you using and why?"* or *"Explain how the blockchain secures this project,"* use these key points:

### 1. Enterprise Private Blockchain: **Hyperledger Fabric**
* We do **not** use public blockchains like Ethereum or Bitcoin because:
  * Public blockchains have high **gas fees** (making it expensive to record every harvest).
  * They have slow transaction speeds.
  * Crop details, pricing, and farm locations contain **private business data** that should not be visible to the public, only to trusted partners.
* **Hyperledger Fabric** is an enterprise, permissioned blockchain. It offers high throughput, zero transaction fees, and absolute privacy controls.

### 2. Smart Contracts (Chaincode)
* Written in **Go (Golang)**.
* Stored in `backend/fabric_config/chaincode/herblock/herblock.go`.
* It contains the rules of the supply chain:
  * Rejects transactions that do not contain valid GPS parameters.
  * Rejects lab reports that do not come from an accredited lab peer.
  * Restricts access so only certified Aggregators can process batches, and only certified Manufacturers can formulate final products.

### 3. Cryptographic SHA-256 Hashing & Merkle Trees
* Every log entry (like a harvest record of 50kg Ashwagandha) is represented by a 64-character hexadecimal **digital fingerprint (SHA-256 hash)**.
* If a single letter or digit of the harvest data is changed (e.g., changing 50kg to 500kg), the hash changes completely.
* We combine these hashes into a **Merkle Tree**, creating a single master fingerprint (**Merkle Root**) for the entire product batch. This provides absolute mathematical proof that none of the history has been tampered with.

---

## 🔬 Section 4: Innovative Features (The "Wow" Factors)

Your project includes unique innovations. Make sure to highlight these to your teacher!

| Feature | Innovation Name | Technical Implementation |
| :--- | :--- | :--- |
| **Claim 1** | **GPS Geo-Fence & Haversine Validation** | The system automatically checks the GPS coordinates of an herb collection against approved geographic cultivation zones. It calculates geodesic distance using the **Haversine Formula**. If a collector tries to record Ashwagandha outside the approved MP/Rajasthan zone, the smart contract rejects it! |
| **Claim 2** | **Immutable Quality Records** | Quality tests are cryptographically signed by accredited lab nodes. Once passed, they are permanently locked onto the ledger. Falsifying pesticide or moisture reports is physically impossible. |
| **Claim 3** | **Multi-Org Consensus Endorsement** | Transactions are not written by a single server. They require signatures from both **Org1 (Farmer Org)** and **Org2 (Processor/Quality Org)**. This consensus policy prevents any single organization from fraud. |

---

## 🎓 Section 5: How to Show the Teacher That Blockchain is Connected (5 Demos)

Here are the 5 practical ways you can demonstrate the live blockchain connection during your presentation:

### 📺 Demo 1: The Live Terminal Docker Container Check (Most Convincing)
Open a terminal on your computer and run this command:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "peer orderer"
```

**What to show the teacher:**
Your screen will display the actual active blockchain network nodes running inside virtual containers:
```
NAMES                           STATUS          PORTS
peer0.org1.example.com          Up 3 hours      0.0.0.0:7051->7051/tcp
peer0.org2.example.com          Up 3 hours      0.0.0.0:9051->9051/tcp  
orderer.example.com             Up 3 hours      0.0.0.0:7050->7050/tcp
```
**Your Explanation:**
> *"Teacher, look at my terminal. These are the active blockchain nodes. We have two peer organizations running (Org1 and Org2) and an Orderer node handling the Raft consensus. This is a real, live distributed network running on my machine, not a mockup!"*

---

### 🌐 Demo 2: The UI Blockchain Status Card
Log into any web dashboard (Farmer, Aggregator, or Lab) at `http://localhost:3000/dashboard`.

**What to show the teacher:**
* Look at the **Network Status Card** on the dashboard.
* When the blockchain is connected, it displays **"Connected"** with a bright green dot.
* It shows the active channel name: `herblock`, version `1.1`, and list of active peer nodes.

**Your Explanation:**
> *"In the dashboard sidebar, you can see our real-time Network Status. It queries our FastAPI backend which communicates with the peer nodes. It proves the channel 'herblock' is online and actively recording transactions."*

---

### 📝 Demo 3: The Multi-Org Endorsement Visualizer
Scroll down on your main dashboard page to see the **Multi-Org Endorsement Panel**.

**What to show the teacher:**
* This panel displays the latest block height recorded on the ledger.
* It shows the specific peers that endorsed the last action:
  * **Org1MSP** (`peer0.org1.example.com:7051`) - **Signed** ✅
  * **Org2MSP** (`peer0.org2.example.com:9051`) - **Signed** ✅
* It displays the active endorsement policy: `OutOf(2, 'Org1MSP.member', 'Org2MSP.member')`.

**Your Explanation:**
> *"Look at this block signing visualizer. Hyperledger Fabric uses an 'Execute-Endorse-Validate' cycle. When we submit a collection or processing step, both Org1 (Farmers) and Org2 (Processors) must execute the smart contract and append their cryptographic signatures. Only when BOTH sign does the Orderer commit the transaction to Block #X."*

---

### 🔍 Demo 4: The Consumer QR Code Trace Page
Go to `http://localhost:3000/trace/ASHWA-TRACE-001`.

**What to show the teacher:**
* Show the gorgeous product traceability page.
* Point to the green **"Blockchain Verified"** badge.
* Scroll down to show the **Harvest Map** showing the exact farm coordinates.
* Point out the **Digital Fingerprints** section showing the **Master Merkle Root** and the individual SHA-256 hashes of each collection, drying, grinding, and lab testing event.

**Your Explanation:**
> *"When a customer scans the QR code on the bottle, they see this trace page. Every single event is stamped with a cryptographic SHA-256 fingerprint. The master fingerprint is the Merkle Root of all these events. If any middleman tries to tamper with the data, the hashes will break, exposing the fraud instantly."*

---

### 🔗 Demo 5: Query the Blockchain Directly via CLI
Open a command prompt, navigate to your network folder, and query the chaincode directly:
```bash
cd backend/fabric-samples/herblock-network
peer chaincode query -C herblock -n herblock -c "{\"function\":\"queryByDocType\",\"Args\":[\"collection\"]}"
```

**What to show the teacher:**
The terminal will spit out raw JSON data stored directly inside the blockchain ledger state.

**Your Explanation:**
> *"To prove that the web app is not just showing mock data from a normal database, I will now bypass the web server entirely and query the blockchain peer node directly via the command-line interface. Here is the raw ledger state returned straight from the peer node!"*
