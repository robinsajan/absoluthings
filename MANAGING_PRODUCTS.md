# Catalog Management Guide

This guide describes how to manage your product catalog on **absoluThings**.

---

## 1. How to Manage Products (Shop Catalog)
The shop catalog contains products that can be ordered or registered to a waitlist. These are managed via the CLI script `Backend/manage_products.py` or the `Backend/products.json` file.

### Option A: Via CLI
Open a terminal in the `Backend` directory and use the `add` action:

```powershell
python manage_products.py add --id "thing-003" --name "Custom Keycap" --price 299 --image "https://example.com/image.jpg" --available true --size "20mm Keycap"
```
* **Arguments:**
  * `--id`: Unique identifier (e.g., `thing-003`)
  * `--name`: Display name of the product
  * `--price`: Price in Rupees (e.g., `299` for ₹299)
  * `--image`: Main showcase image URL
  * `--available`: `true` (renders "Order Now") or `false` (renders "Join Waitlist")
  * `--size`: Dimensions details

### Option B: Via JSON Batch Import
1. Add the product block to [products.json](file:///c:/Users/test/OneDrive/Desktop/absoluthings-app/Backend/products.json):
   ```json
   {
       "id": "thing-003",
       "name": "Custom Keycap",
       "price": 299,
       "description": "A detailed 3D printed keycap.",
       "image_url": "https://example.com/image.jpg",
       "images": [
           "https://example.com/image.jpg"
       ],
       "is_available": true,
       "size_details": "20mm Keycap"
   }
   ```
2. Run the import tool in the `Backend` directory:
   ```powershell
   python manage_products.py import --file products.json
   ```

---

## 2. General Commands List

To list existing items in the database:
```powershell
python manage_products.py list
```

To delete an item:
```powershell
python manage_products.py delete --id thing-003
```
