from dotenv import load_dotenv
load_dotenv()

from app import app
from models import db

def seed():
    with app.app_context():
        # Create tables if they do not exist (retains existing data)
        db.create_all()
        db.session.commit()
        print("Database tables verified/created successfully (no data cleared).")

if __name__ == '__main__':
    seed()
