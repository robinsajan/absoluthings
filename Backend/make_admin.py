"""
Run this once to grant admin privileges to your email.
Usage: python make_admin.py your@email.com
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

from app import app
from models import db, User

def make_admin(email: str):
    email = email.strip().lower()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_admin = True
            print(f"Updated existing user '{email}' → is_admin = True")
        else:
            user = User(email=email, is_admin=True)
            db.session.add(user)
            print(f"Created new user '{email}' with is_admin = True")
        db.session.commit()
        print("Done! You can now log in to the admin panel.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py your@email.com")
        sys.exit(1)
    make_admin(sys.argv[1])
