from flask import Flask, request, jsonify, redirect, url_for, render_template_string, render_template
from utils import Yavne_weather, NeapolitanPizza
import json
import random
import os
from pathlib import Path

app = Flask('Pizza Moshe')
orders = []
admins = ['Ron', 'Mohammad', 'Moshe', 'Shlomi']
json_dir = Path(__file__).resolve().parent / "jsons"
temp_dir = Path(__file__).resolve().parent / "temp_orders"
pages_dir = Path(__file__).resolve().parent / "templates"
order_storage = json_dir/"order.json"
order_page = pages_dir/"order.html"

def load_order():
    with open(order_storage, "r", encoding="utf-8") as f:
        return json.load(f)

def order_fetch(url_id:int):
        fetched_path = temp_dir/(f"order_{url_id}.json")
        if not fetched_path.exists():
            return None
        with open(fetched_path, "r", encoding="utf-8") as f:
            return json.load(f)    

current_id = int(load_order()["id"])

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
def order_show(url_id:int):
        fetched_json = order_fetch(url_id)
        if (fetched_json != None) and (fetched_json["id"] == url_id):
            return fetched_json
        elif fetched_json == None:
            return jsonify({"error": "Order not found"}), 404
        

@app.route('/moshepizza/order/')
def ordering_page():
    return render_template('order.html')


@app.post('/moshepizza/order/place-order')
def place_order():
    order_id = random.randint(100000, 999999)
    data = request.get_json()
    data['id'] = order_id
    with open(order_storage,"w") as f:
        json.dump(data, f, indent = 4)  
    return 'Order placed successfully'




@app.post('/moshepizza/order/pizza')
def create_pizza():
    data = load_order() or {}
    pizza = data.get("order", {}).get("items", {}).get("pizza", {})
    order_id = data.get("id", {})

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
    orders.append(order)
    
    folder = "temp_orders"
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, f"order_{order_id}.json")
    with open(file_path,"w") as f:
        json.dump(order, f, indent = 4)
    
    return jsonify(order), 201



@app.get('/moshepizza/order/pizza')
def last_orders():
    if not orders:
        return jsonify({"message": "nothing yet"}), 200
    return jsonify(orders[-1]), 200


@app.get('/moshepizza/order/pizza/all-orders')
def all_orders():
    return jsonify(orders), 200


@app.route('/moshepizza/admin_page')
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


@app.get('/moshepizza/admin_page/Kitchen_bon')
def make_dough():
    weather = Yavne_weather()
    current = weather.temperature("Yavne", "IL")["current"]

    pizza = NeapolitanPizza()
    recipe = pizza.dough(
        ball_weight=300,
        temp_c=current["temp_c"],
        humidity_pct=current["humidity_pct"]
    )
    return jsonify(recipe), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000)

