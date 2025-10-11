"""Database connection"""
from pymongo import MongoClient
from app.core.config import settings

_client = None
_db = None

def get_db():
    """Get MongoDB database"""
    global _client, _db
    
    if _db is None:
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client[settings.MONGODB_DB_NAME]
    
    return _db

