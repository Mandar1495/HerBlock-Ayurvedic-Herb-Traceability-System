import asyncio
from services.fabric_service import fabric_service

async def main():
    print("🔍 Testing connection to Hyperledger Fabric...")
    is_connected = await fabric_service.check_connection()
    print(f"Connection result: {is_connected}")
    print(f"Last Error: {fabric_service.last_error}")

if __name__ == "__main__":
    asyncio.run(main())
