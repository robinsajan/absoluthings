from dotenv import load_dotenv
load_dotenv()

from app import app
from models import db

def seed():
    with app.app_context():
        # Drop all to recreate tables with new schema and clear all data
        db.drop_all()
        db.create_all()
        db.session.commit()
        print("Database cleared and initialized with empty tables successfully!")

if __name__ == '__main__':
    seed()
