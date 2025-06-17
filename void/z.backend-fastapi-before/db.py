from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client["spending_db"]
collection = db["spending_logs"]
