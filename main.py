from flask import Flask, request, jsonify, redirect, url_for
import json
import os
from pathlib import Path

app = Flask('Pizza Moshe')
orders = []
admins = ['Ron', 'Mohammad', 'Moshe', 'Shlomi']
json_dir = Path(__file__).resolve().parent / "jsons"
order_storage = json_dir/"order.json"

def load_order():
    with open(order_storage, "r", encoding="utf-8") as f:
        return json.load(f)

url_id = int(load_order()["order"]["id"])

class Pizza:
    def __init__(self, size: str = "small", crust: str = "thin", topping: list | None = None):
        self.size = size
        self.crust = crust
        self.topping = topping or []

    def add_topping(self, topping: str):
        if topping not in self.topping:
            self.topping.append(topping)

    def to_dict(self):
        return {
            "size": self.size,
            "crust": self.crust,
            "topping": self.topping if self.topping else ["regular pizza , noob"]
        }

    def __str__(self):
        return f"{self.size} pizza , {self.crust} {self.topping if self.topping else 'regular pizza , noob'}"

@app.get('/moshepizza/order/<int:url_id>')
def current_order(url_id:int):
    current_meal = load_order()
    if current_meal["order"]["id"] == url_id:
        return current_meal


@app.post('/moshepizza/order/pizza')
def create_pizza():
    data = load_order() or {}
    pizza = data.get("order", {}).get("items", {}).get("pizza", {})
    order_id = data.get("order", {}).get("id", "unknown")


    size = pizza.get("size", "small")
    crust = pizza.get("crust", "thin")
    topping = pizza.get("topping", [])
    if isinstance(topping, str):
        topping = [topping]
    elif not isinstance(topping, list):
        return jsonify({"error": "topping must be a list or string"}), 400

    pizza_is = Pizza(size, crust, topping)
    order = pizza_is.to_dict()
    orders.append(order)
    
    folder = "temp_orders"
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, f"order_{order_id}.json")
    with open(file_path,"w") as f:
        json.dump(order, f, indent = 4)
    
    return jsonify(order), 201



@app.get('/moshepizza//order/pizza')
def last_orders():
    if not orders:
        return jsonify({"message": "nothing yet"}), 200
    return jsonify(orders[-1]), 200


@app.get('/moshepizza/order/pizza/all-orders')
def all_orders():
    return jsonify(orders), 200


@app.route('/admin_page')
def admin():
    return f'Welcome Slave'


@app.route('/customer_page')
def costumer():
    return f'welcome to Pizza Moshe'


@app.route('/moshepizza/<name>')
def logon(name):
    if name in admins:
        return redirect(url_for('admin_page'))
    else:
        return redirect(url_for('customer_page'))


if __name__ == '__main__':
    app.run(port=5000)
