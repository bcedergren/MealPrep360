"""Database connection manager"""
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger

from app.core.config import settings

class DatabaseManager:
    """Async MongoDB connection manager"""
    
    def __init__(self):
        self.client: AsyncIOMotorClient | None = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client[settings.MONGODB_DB_NAME]
            
            # Verify connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    def get_collection(self, name: str):
        """Get a collection"""
        if not self.db:
            raise RuntimeError("Database not connected")
        return self.db[name]

# Singleton
db_manager = DatabaseManager()

