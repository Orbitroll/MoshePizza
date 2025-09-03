from flask import Flask, request, jsonify, redirect, url_for,render_template
import data
import json
import random
import os
from clock import timestamp
from data import  orders, order_storage, temp_dir
from admins.orders import load_order ,order_fetch
from loggs.logger import Logger

logger = Logger("orders.log")

app = Flask('Pizza Moshe')
from admins.admin import admin_bp
from users.Users import users_bp

app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(users_bp, url_prefix='/users')


def pizza_fetch(url_id: int):
    fetched_path = temp_dir / (f"pizza_{url_id}.json")
    if not fetched_path.exists():
        logger.log(f'Pizza fetch failed: file not found for id={url_id}')
        return None
    with open(fetched_path, "r", encoding="utf-8") as f:
        logger.log(f'ID : {url_id} Was fetched')
        return json.load(f)


current_id = int(load_order()["id"])



@app.get('/order/pizza/<int:url_id>')
def pizza_show(url_id: int):
    fetched_json = pizza_fetch(url_id)
    if fetched_json is not None and (fetched_json["id"] == url_id):
        logger.log(f"Pizza {url_id} found successfully")
        return jsonify(fetched_json) , 200
    elif fetched_json is None:
        logger.log(f"{url_id} error: Pizza not found")
        return jsonify({"error": "Pizza not found"}), 404


@app.route('/order/')
def ordering_page():
    return render_template('order.html')


@app.post('/order/place-order')
def place_order():
    order_id = random.randint(100000, 999999)
    data = request.get_json()
    data['id'] = order_id
    data['timestamp'] = timestamp()

    with open(order_storage, "w") as f:
        json.dump(data, f, indent=4)
    orders_name = "orders"
    os.makedirs(orders_name, exist_ok=True)
    file_path = os.path.join(orders_name, f"order_{order_id}.json")
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)
    logger.log(f"New order placed: id={order_id}, {timestamp()}")
    orders.append(data)
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
