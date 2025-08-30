from flask import Flask, request, jsonify, redirect, url_for,render_template
import data
import json
import random
import os
from clock import timestamp
from data import orders_dir, orders, order_storage, temp_dir
from admins.orders import load_order ,order_fetch

app = Flask('Pizza Moshe')
from admins.admin import admin_bp
from users.Users import users_bp

app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(users_bp, url_prefix='/users')


def pizza_fetch(url_id: int):
    fetched_path = temp_dir / (f"pizza_{url_id}.json")
    if not fetched_path.exists():
        return None
    with open(fetched_path, "r", encoding="utf-8") as f:
        return json.load(f)


current_id = int(load_order()["id"])
current_table = load_order()["order"]["table"]


@app.get('/order/pizza/<int:url_id>')
def pizza_show(url_id: int):
    fetched_json = pizza_fetch(url_id)
    if (fetched_json != None) and (fetched_json["id"] == url_id):
        return fetched_json
    elif fetched_json == None:
        return jsonify({"error": "Pizza not found"}), 404


@app.route('/order/')
def ordering_page():
    return render_template('order.html')


@app.post('/order/place-order')
def place_order():
    order_id = random.randint(100000, 999999)
    data = request.get_json()
    data['id'] = order_id
    data['timestamp'] = timestamp

    with open(order_storage, "w") as f:
        json.dump(data, f, indent=4)
    orders_name = "orders"
    os.makedirs(orders_name, exist_ok=True)
    file_path = os.path.join(orders_name, f"order_{order_id}.json")
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)
    return 'Order placed successfully'


@app.get('/order/<int:url_id>')
def order_show(url_id: int):
    fetched_json = order_fetch(url_id)
    if (fetched_json != None) and (fetched_json["id"] == url_id):
        return fetched_json
    elif fetched_json == None:
        return jsonify({"error": "Order not found"}), 404


@app.get('/order/pizza')
def last_orders():
    if not orders:
        return jsonify({"message": "nothing yet"}), 200
    return jsonify(orders[-1]), 200


@app.get('/order/table-<int:table_id>')
def table_show(table_id):
    pass


@app.get('/order/pizza/all-pizzas')
def all_pizzas():
    return jsonify(orders), 200


@app.route('/<name>')
def logon(name):
    if name in data.admins:
        return redirect(url_for('admin'))
    else:
        return redirect(url_for('users'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
