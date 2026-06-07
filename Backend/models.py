from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.String(50), primary_key=True)  # e.g., 'thing-001'
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Integer, nullable=False)  # in cents
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to get all secondary images
    images = db.relationship('ProductImage', backref='product', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        imgs = [img.image_url for img in sorted(self.images, key=lambda x: x.display_order)] if self.images else []
        if not imgs and self.image_url:
            imgs = [self.image_url]
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image_url': self.image_url,
            'images': imgs,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ProductImage(db.Model):
    __tablename__ = 'product_images'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'image_url': self.image_url,
            'display_order': self.display_order
        }

class WaitingList(db.Model):
    __tablename__ = 'waiting_list'
    __table_args__ = (db.UniqueConstraint('email', 'product_id', name='uq_waiting_list_email_product_id'),)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', backref='waiting_list_entries')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'product_id': self.product_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'product': self.product.to_dict() if self.product else None
        }

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to easily fetch product details with cart item
    product = db.relationship('Product', backref='cart_items')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'product': self.product.to_dict() if self.product else None
        }

class OTP(db.Model):
    __tablename__ = 'otps'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PastOrder(db.Model):
    __tablename__ = 'past_orders'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    status = db.Column(db.String(50), default='Processing')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', backref='past_orders')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'product': self.product.to_dict() if self.product else None
        }
