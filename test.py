from fastapi import FastAPI
from pydantic import BaseModel
from inventory import inventory
from supplies import supplier_stock
app = FastAPI()

class OrderRequest(BaseModel):
    item: str
    quantity: int


def find_category(item_name: str):
    for category, items in inventory.items():
        if item_name in items:
            return category
    return None


def auto_restock(category: str, item: str, batch_size: int = 20):
    current_qty = inventory[category][item]
    supplier_qty = supplier_stock[category].get(item, 0)
    max_capacity = supplier_qty + current_qty
    threshold = max_capacity * 0.2

    if current_qty <= threshold and supplier_qty > 0:
        restock_amount = min(batch_size, supplier_qty)
        inventory[category][item] += restock_amount
        supplier_stock[category][item] -= restock_amount
        return f"Auto-restocked {restock_amount} {item}."
    return None


@app.post("/order")
def place_order(order: OrderRequest):
    item = order.item
    qty = order.quantity

    category = find_category(item)
    if not category:
        return {"status": "error", "message": f"{item} not found in inventory."}

    if inventory[category][item] < qty:
        return {"status": "error", "message": f"Not enough {item} in inventory. Available: {inventory[category][item]}"}

    inventory[category][item] -= qty
    restock_message = auto_restock(category, item, batch_size=20)

    return {
        "status": "success",
        "message": f"Order placed for {qty} {item}.",
        "remaining_inventory": inventory[category][item],
        "remaining_supplier": supplier_stock[category][item],
        "restock_action": restock_message or "No restock needed."
    }