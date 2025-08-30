from flask import Blueprint, jsonify
from classes import Yavne_weather, NeapolitanPizza ,Pizza
import json
import os
from data import orders
from main import load_order

admin_bp = Blueprint('admin_bp', __name__)


@admin_bp.get('/Kitchen_bon')
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


@admin_bp.post('/order/pizza')
def create_pizza():
    data = load_order() or {}
    pizza = data.get("order", {}).get("items", {}).get("pizza", {})
    order_id = data.get("id", {})
    time = data.get("timestamp", {}).get("time", {})

    pizza_type = pizza.get("type", "custom")
    size = pizza.get("size", "small")
    crust = pizza.get("crust", "thin")
    topping = pizza.get("topping", [])
    if isinstance(topping, str):
        topping = [topping]
    elif not isinstance(topping, list):
        return jsonify({"error": "topping must be a list or string"}), 400

    pizza_is = Pizza(size, crust, topping)
    order = pizza_is.to_dict()
    order["Pizza type"] = pizza_type
    order["id"] = order_id
    order["time"] = time
    orders.append(order)

    folder = "temp_pizzas"
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, f"pizza_{order_id}.json")
    with open(file_path, "w") as f:
        json.dump(order, f, indent=4)

    return jsonify(order), 201

@admin_bp.route('/')
def admin():
    return f'welcome sadmin'
