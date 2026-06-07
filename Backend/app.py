import os
import random
import re
from datetime import datetime, timedelta
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import resend
from models import db, Product, WaitingList, CartItem, OTP, ProductImage, PastOrder, CustomRequest

load_dotenv()

resend.api_key = os.environ.get('RESEND_API_KEY')


app = Flask(__name__)
# Enable CORS for Next.js frontend (typically port 3000)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Database Configuration — Supabase PostgreSQL
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    raise RuntimeError('DATABASE_URL environment variable is not set. Please configure your .env file.')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'absoluthings_super_secret_key_129847129')

db.init_app(app)

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

def validate_email(email):
    return re.match(EMAIL_REGEX, email) is not None

def generate_jwt_token(email):
    payload = {
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_jwt_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['email']
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def token_required(f):
    def decorator(*args, **kwargs):
        token = None
        # Check authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        email = verify_jwt_token(token)
        if not email:
            return jsonify({'error': 'Token is invalid or expired'}), 401
            
        return f(email, *args, **kwargs)
    
    # Flask routes need unique endpoint names
    decorator.__name__ = f.__name__
    return decorator

# --- API Routes ---

@app.route("/")
def health():
    return "OK"


@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products]), 200

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict()), 200

@app.route('/api/waitinglist/join', methods=['POST'])
def join_waiting_list():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    product_id = data.get('product_id', '').strip()

    if not email or not validate_email(email):
        return jsonify({'error': 'A valid email address is required'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': f'Product {product_id} does not exist'}), 404

    # Check if already joined
    existing = WaitingList.query.filter_by(email=email, product_id=product_id).first()
    if existing:
        return jsonify({'error': 'You are already on the waiting list for this product'}), 400

    new_entry = WaitingList(email=email, product_id=product_id)
    db.session.add(new_entry)
    db.session.commit()

    return jsonify({
        'message': 'Successfully joined the waiting list',
        'entry': new_entry.to_dict()
    }), 201

@app.route('/api/custom-requests', methods=['POST'])
def create_custom_request():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    material = data.get('material', '').strip()
    quantity = data.get('quantity', 1)
    file_link = data.get('file_link', '').strip()
    description = data.get('description', '').strip()

    if not name or not email or not validate_email(email):
        return jsonify({'error': 'Name and a valid email are required'}), 400

    new_req = CustomRequest(
        name=name,
        email=email,
        material=material,
        quantity=quantity,
        file_link=file_link,
        description=description
    )
    db.session.add(new_req)
    db.session.commit()



    return jsonify({
        'message': 'Thank you! Your custom printing request has been received. Our team will contact you shortly.',
        'request': new_req.to_dict()
    }), 201


@app.route('/api/auth/otp/request', methods=['POST'])
def request_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email or not validate_email(email):
        return jsonify({'error': 'A valid email address is required'}), 400

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Clean old OTPs for this email
    OTP.query.filter_by(email=email).delete()

    new_otp = OTP(email=email, code=otp_code, expires_at=expires_at)
    db.session.add(new_otp)
    db.session.commit()

    # Send email via Resend
    email_sent = False
    try:
        if resend.api_key:
            from_email = os.environ.get('MAIL_FROM', 'noreply@absoluthings.com')
            resend.Emails.send({
                "from": from_email,
                "to": email,
                "subject": "OTP absoluThings",
                "html": (
                    f"<p>Your verification code is:</p>"
                    f"<h2 style='font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 16px 0;'>{otp_code}</h2>"
                    f"<p>This code will expire in 5 minutes.</p>"
                    f"<p>If you did not request this code, you can safely ignore this email.</p>"
                    f"<p>Thank you,<br/>AbsolutThings</p>"
                )
            })
            email_sent = True
    except Exception as e:
        print(f"Error sending email via Resend: {e}")

    return jsonify({
        'message': 'OTP sent successfully (check your email)'
    }), 200

@app.route('/api/auth/otp/verify', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()

    if not email or not code:
        return jsonify({'error': 'Email and OTP code are required'}), 400

    otp_record = OTP.query.filter_by(email=email, code=code).first()

    if not otp_record:
        return jsonify({'error': 'Invalid OTP code'}), 400

    if otp_record.expires_at < datetime.utcnow():
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({'error': 'OTP code has expired'}), 400

    # Clean up OTP record after successful verification
    db.session.delete(otp_record)
    db.session.commit()

    # Generate session JWT token
    token = generate_jwt_token(email)

    return jsonify({
        'message': 'OTP verified successfully',
        'token': token,
        'email': email
    }), 200

# --- Orders API Routes ---

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(email):
    waiting_entries = WaitingList.query.filter_by(email=email).all()
    past_orders = PastOrder.query.filter_by(email=email).all()
    return jsonify({
        'waiting_list': [item.to_dict() for item in waiting_entries],
        'past_orders': [item.to_dict() for item in past_orders]
    }), 200

# --- Cart API Routes ---

@app.route('/api/cart', methods=['GET'])
@token_required
def get_cart(email):
    cart_items = CartItem.query.filter_by(email=email).all()
    return jsonify([item.to_dict() for item in cart_items]), 200

@app.route('/api/cart', methods=['POST'])
@token_required
def add_to_cart(email):
    data = request.get_json() or {}
    product_id = data.get('product_id', '').strip()
    quantity = int(data.get('quantity', 1))

    if not product_id or quantity <= 0:
        return jsonify({'error': 'Product ID and a positive quantity are required'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    # Check if item already in cart
    item = CartItem.query.filter_by(email=email, product_id=product_id).first()
    if item:
        item.quantity += quantity
    else:
        item = CartItem(email=email, product_id=product_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    return jsonify(item.to_dict()), 200

@app.route('/api/cart/update', methods=['PUT'])
@token_required
def update_cart_quantity(email):
    data = request.get_json() or {}
    product_id = data.get('product_id', '').strip()
    quantity = int(data.get('quantity', 0))

    if not product_id or quantity < 0:
        return jsonify({'error': 'Product ID and a valid quantity are required'}), 400

    item = CartItem.query.filter_by(email=email, product_id=product_id).first()
    if not item:
        return jsonify({'error': 'Item not found in cart'}), 404

    if quantity == 0:
        db.session.delete(item)
    else:
        item.quantity = quantity

    db.session.commit()
    
    # Return updated cart
    cart_items = CartItem.query.filter_by(email=email).all()
    return jsonify([item.to_dict() for item in cart_items]), 200

@app.route('/api/cart/remove', methods=['DELETE'])
@token_required
def remove_from_cart(email):
    data = request.get_json() or {}
    product_id = data.get('product_id', '').strip()

    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400

    item = CartItem.query.filter_by(email=email, product_id=product_id).first()
    if not item:
        return jsonify({'error': 'Item not found in cart'}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'Item removed from cart'}), 200

# Create DB script runner helper
@app.cli.command("init-db")
def init_db():
    """Initialize the database."""
    db.create_all()
    print("Database initialized successfully!")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=False
    )
