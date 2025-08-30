import app
from flask import Flask, request, jsonify, redirect, url_for, render_template_string, render_template
from classes import Yavne_weather, NeapolitanPizza
import json
import random
import os
from pathlib import Path
from clock import timestamp
from admins.admin import admin_bp

app.register_blueprint(admin_bp,url_prefix='/admin')

app = Flask('Pizza Moshe')
orders = []
admins = ['Ron', 'Mohammad', 'Moshe', 'Shlomi']
json_dir = Path(__file__).resolve().parent / "jsons"
temp_dir = Path(__file__).resolve().parent / "temp_pizzas"
pages_dir = Path(__file__).resolve().parent / "templates"
orders_dir = Path(__file__).resolve().parent / "orders"
order_storage = json_dir/"order.json"
order_page = pages_dir/"order.html"

def load_order():
    with open(order_storage, "r", encoding="utf-8") as f:
        return json.load(f)

def pizza_fetch(url_id:int):
        fetched_path = temp_dir/(f"pizza_{url_id}.json")
        if not fetched_path.exists():
            return None
        with open(fetched_path, "r", encoding="utf-8") as f:
            return json.load(f)
        
def order_fetch(url_id:int):
        fetched_path = orders_dir/(f"order_{url_id}.json")
        if not fetched_path.exists():
            return None
        with open(fetched_path, "r", encoding="utf-8") as f:
            return json.load(f)       


current_id = int(load_order()["id"])
current_table = load_order()["order"]["table"]

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


@app.get('/moshepizza/order/pizza/<int:url_id>')
def pizza_show(url_id:int):
        fetched_json = pizza_fetch(url_id)
        if (fetched_json != None) and (fetched_json["id"] == url_id):
            return fetched_json
        elif fetched_json == None:
            return jsonify({"error": "Pizza not found"}), 404
        

@app.route('/moshepizza/order/')
def ordering_page():
    return render_template('order.html')


@app.post('/moshepizza/order/place-order')
def place_order():
    order_id = random.randint(100000, 999999)
    data = request.get_json()
    data['id'] = order_id
    data['timestamp'] = timestamp

    with open(order_storage,"w") as f:
        json.dump(data, f, indent = 4)
    orders_name = "orders"
    os.makedirs(orders_name, exist_ok=True)
    file_path = os.path.join(orders_name, f"order_{order_id}.json")
    with open(file_path,"w") as f:
        json.dump(data, f, indent = 4)  
    return 'Order placed successfully'

@app.get('/moshepizza/order/<int:url_id>')
def order_show(url_id:int):
        fetched_json = order_fetch(url_id)
        if (fetched_json != None) and (fetched_json["id"] == url_id):
            return fetched_json
        elif fetched_json == None:
            return jsonify({"error": "Order not found"}), 404




@app.post('/moshepizza/order/pizza')
def create_pizza():
    data = load_order() or {}
    pizza = data.get("order", {}).get("items", {}).get("pizza", {})
    order_id = data.get("id", {})
    time = data.get("timestamp", {}).get("time", {})

    type = pizza.get("type", "custom")
    size = pizza.get("size", "small")
    crust = pizza.get("crust", "thin")
    topping = pizza.get("topping", [])
    if isinstance(topping, str):
        topping = [topping]
    elif not isinstance(topping, list):
        return jsonify({"error": "topping must be a list or string"}), 400

    pizza_is = Pizza(size, crust, topping)
    order = pizza_is.to_dict()
    order["type"] = type
    order["id"] = order_id
    order["time"] = time
    orders.append(order)
    
    folder = "temp_pizzas"
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, f"pizza_{order_id}.json")
    with open(file_path,"w") as f:
        json.dump(order, f, indent = 4)
    
    return jsonify(order), 201



@app.get('/moshepizza/order/pizza')
def last_orders():
    if not orders:
        return jsonify({"message": "nothing yet"}), 200
    return jsonify(orders[-1]), 200


@app.get('/moshepizza/order/table-<int:table_id>')
def table_show(table_id):
    pass




@app.get('/moshepizza/order/pizza/all-pizzas')
def all_pizzas():
    return jsonify(orders), 200





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
    app.run(host='0.0.0.0',port=5000)

