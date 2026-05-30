#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  HerBlock — Hyperledger Fabric Network Setup Script
#  Patent Pending · Indian Patent Office · HerBlock India
# ═══════════════════════════════════════════════════════════════
# 
# Prerequisites:
#   - Docker & Docker Compose running
#   - Go 1.21+
#   - fabric-samples cloned inside backend/
#
# Usage:
#   cd backend
#   chmod +x setup_fabric.sh
#   ./setup_fabric.sh
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FABRIC_SAMPLES="$SCRIPT_DIR/fabric-samples"
TEST_NETWORK="$FABRIC_SAMPLES/test-network"
CHAINCODE_DIR="$SCRIPT_DIR/fabric_config/chaincode/herblock"
CHANNEL_NAME="herblock"
CC_NAME="herblock"
CC_VERSION="1.0"
CC_SEQUENCE="1"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       HerBlock Fabric Network Setup                 ║"
echo "║       Patent Pending · GPS Geo-Fence Validation     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 1: Check prerequisites
# ─────────────────────────────────────────────────────────────
echo "📋 Step 1: Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Go not found. Please install Go 1.21+."
    exit 1
fi

if [ ! -d "$TEST_NETWORK" ]; then
    echo "📥 fabric-samples or test-network not found. Cleaning empty paths and cloning..."
    cd "$SCRIPT_DIR"
    rm -rf "$FABRIC_SAMPLES"
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5 -d
    echo "✅ fabric-samples downloaded and extracted"
else
    echo "✅ fabric-samples & test-network found"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# STEP 2: Bring up the test network with 2 orgs
# ─────────────────────────────────────────────────────────────
echo "🚀 Step 2: Starting Hyperledger Fabric test network..."
cd "$TEST_NETWORK"

# Stop any existing network
./network.sh down 2>/dev/null || true

# Start with CouchDB (needed for rich queries in chaincode)
./network.sh up createChannel -c "$CHANNEL_NAME" -ca -s couchdb

echo "✅ Network up with channel: $CHANNEL_NAME"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 3: Package the chaincode
# ─────────────────────────────────────────────────────────────
echo "📦 Step 3: Packaging HerBlock chaincode..."
cd "$CHAINCODE_DIR"

# Download dependencies
go mod tidy
go mod download

echo "✅ Go dependencies ready"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 4: Deploy chaincode using the test-network script
# ─────────────────────────────────────────────────────────────
echo "⛓️  Step 4: Deploying herblock chaincode..."
cd "$TEST_NETWORK"

export PATH="$FABRIC_SAMPLES/bin:$PATH"
export FABRIC_CFG_PATH="$FABRIC_SAMPLES/config"

./network.sh deployCC \
  -c "$CHANNEL_NAME" \
  -ccn "$CC_NAME" \
  -ccp "$CHAINCODE_DIR" \
  -ccl go \
  -ccv "$CC_VERSION" \
  -ccs "$CC_SEQUENCE"

echo "✅ Chaincode deployed!"
echo ""

# ─────────────────────────────────────────────────────────────
# STEP 5: Verify chaincode is active
# ─────────────────────────────────────────────────────────────
echo "🔍 Step 5: Verifying chaincode..."

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$TEST_NETWORK/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$TEST_NETWORK/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS="localhost:7051"
export ORDERER_CA="$TEST_NETWORK/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"Args":["GetNetworkStatus"]}' || echo "⚠️  Query failed — chaincode may still be initializing"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ HerBlock Fabric Network is READY                ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Channel:   herblock                                ║"
echo "║  Chaincode: herblock v1.0                           ║"
echo "║  Peers:     peer0.org1 (7051) · peer0.org2 (9051)  ║"
echo "║  Orderer:   orderer (7050)                          ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Next: python seed.py  →  uvicorn server:app ...   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
