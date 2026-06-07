import argparse
import sys
import json
from app import app
from models import db, Product, ProductImage

def add_product(product_id, name, description, price, image_url, additional_images=None):
    with app.app_context():
        # Check if product already exists
        existing = Product.query.get(product_id)
        if existing:
            print(f"Product with ID '{product_id}' already exists. Use update action to modify it.")
            return False
            
        new_prod = Product(
            id=product_id,
            name=name,
            description=description,
            price=price,
            image_url=image_url
        )
        db.session.add(new_prod)
        db.session.flush() # Flush to get new_prod associated

        if additional_images:
            if isinstance(additional_images, str):
                urls = [url.strip() for url in additional_images.split(",") if url.strip()]
            else:
                urls = additional_images
            for order, url in enumerate(urls):
                new_img = ProductImage(product_id=product_id, image_url=url, display_order=order)
                db.session.add(new_img)

        db.session.commit()
        print(f"Product '{name}' (ID: {product_id}) added successfully!")
        return True

def list_products():
    with app.app_context():
        products = Product.query.all()
        if not products:
            print("No products found in database.")
            return
            
        print("\n--- Product Catalog ---")
        for p in products:
            print(f"ID:          {p.id}")
            print(f"Name:        {p.name}")
            print(f"Price:       ₹{p.price}")
            print(f"Description: {p.description}")
            print(f"Image URL:   {p.image_url}")
            imgs = [img.image_url for img in sorted(p.images, key=lambda x: x.display_order)]
            print(f"Gallery:     {', '.join(imgs) if imgs else 'None'}")
            print("-" * 30)

def update_product(product_id, name=None, description=None, price=None, image_url=None, additional_images=None):
    with app.app_context():
        p = Product.query.get(product_id)
        if not p:
            print(f"Product with ID '{product_id}' not found.")
            return False
            
        if name:
            p.name = name
        if description:
            p.description = description
        if price is not None:
            p.price = price
        if image_url:
            p.image_url = image_url
            
        if additional_images is not None:
            # Clear existing secondary images
            ProductImage.query.filter_by(product_id=product_id).delete()
            if isinstance(additional_images, str):
                urls = [url.strip() for url in additional_images.split(",") if url.strip()]
            else:
                urls = additional_images
            for order, url in enumerate(urls):
                new_img = ProductImage(product_id=product_id, image_url=url, display_order=order)
                db.session.add(new_img)

        db.session.commit()
        print(f"Product '{product_id}' updated successfully!")
        return True

def delete_product(product_id):
    with app.app_context():
        p = Product.query.get(product_id)
        if not p:
            print(f"Product with ID '{product_id}' not found.")
            return False
            
        db.session.delete(p)
        db.session.commit()
        print(f"Product '{product_id}' deleted successfully!")
        return True

def import_from_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, list):
                print("Error: JSON root must be a list of products.")
                return False
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return False

    success_count = 0
    with app.app_context():
        for idx, item in enumerate(data):
            p_id = item.get('id')
            name = item.get('name')
            price = item.get('price')
            desc = item.get('description', '')
            img_url = item.get('image_url', '')
            gallery = item.get('images', [])

            if not p_id or not name or price is None:
                print(f"Skipping item #{idx}: 'id', 'name', and 'price' are required.")
                continue

            # Check if it exists to add or update
            existing = Product.query.get(p_id)
            if existing:
                print(f"Updating product '{p_id}'...")
                update_product(p_id, name=name, description=desc, price=price, image_url=img_url, additional_images=gallery)
            else:
                print(f"Adding product '{p_id}'...")
                add_product(p_id, name=name, description=desc, price=price, image_url=img_url, additional_images=gallery)
            success_count += 1
            
    print(f"Successfully processed {success_count} products from JSON.")
    return True

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    parser = argparse.ArgumentParser(description="Manage Absoluthings products.")
    parser.add_argument('action', choices=['add', 'list', 'update', 'delete', 'import'], help="Action to perform")
    parser.add_argument('--id', help="Product ID (e.g. thing-001)")
    parser.add_argument('--name', help="Product name")
    parser.add_argument('--desc', help="Product description")
    parser.add_argument('--price', type=int, help="Product price in Rupees (e.g. 199 for ₹199)")
    parser.add_argument('--image', help="Product primary image URL")
    parser.add_argument('--images', help="Comma-separated gallery image URLs")
    parser.add_argument('--file', help="Path to JSON file for import action")
    
    args = parser.parse_args()
    
    if args.action == 'list':
        list_products()
    elif args.action == 'add':
        if not args.id or not args.name or args.price is None:
            print("Error: --id, --name, and --price are required for 'add' action.")
            sys.exit(1)
        add_product(args.id, args.name, args.desc or '', args.price, args.image or '', args.images)
    elif args.action == 'update':
        if not args.id:
            print("Error: --id is required for 'update' action.")
            sys.exit(1)
        update_product(args.id, args.name, args.desc, args.price, args.image, args.images)
    elif args.action == 'delete':
        if not args.id:
            print("Error: --id is required for 'delete' action.")
            sys.exit(1)
        delete_product(args.id)
    elif args.action == 'import':
        if not args.file:
            print("Error: --file parameter is required for 'import' action.")
            sys.exit(1)
        import_from_json(args.file)

