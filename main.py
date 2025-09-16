from flask import Flask, request, jsonify, redirect, url_for,render_template
import data
import json
import random
import os
from clock import timestamp
from data import  orders, order_storage, temp_dir
from admins.orders import load_order ,order_fetch
from loggs.logger import Logger
from DataBase import db
from DataBase.models import Invoice

logger = Logger("orders.log")

app = Flask('Pizza Moshe')
DB_PATH = os.path.join(app.root_path , "DataBase", "invoice.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

from sqlalchemy import inspect , text

with app.app_context():
    db.create_all()

    insp = inspect(db.engine)
    print("== DB tables ==", insp.get_table_names())


from admins.admin import admin_bp
from users.Users import users_bp
from tables_system.tables_flask import tables_bp
from invoices_system.dynamic_invoices import invoices_bp

app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(users_bp, url_prefix='/users')
app.register_blueprint(tables_bp, url_prefix='/tables')
app.register_blueprint(invoices_bp, url_prefix='/invoices')

def pizza_fetch(url_id: int):
    fetched_path = temp_dir / (f"pizza_{url_id}.json")
    if not fetched_path.exists():
        logger.log(f'Pizza fetch failed: file not found for id={url_id}')
        return None
    with open(fetched_path, "r", encoding="utf-8") as f:
        logger.log(f'ID : {url_id} Was fetched')
        return json.load(f)


try:
    current_id = int(load_order()["id"])
except Exception:
    current_id = None

import pizza_types as pizza_types

TYPE_ALIASES = {
    "Anti-VeganF": "Anti_VeganF",
    "Anti-VeganP": "Anti_VeganP",
    "MediterreneanF": "MediterreneanF",
    "MediterreneanP": "MediterreneanP",
    "NeapolitanF": "NeapolitanF",
    "NeapolitanP": "NeapolitanP",
    "Mexican_BraveryF": "Mexican_BraveryF",
    "Mexican_BraveryP": "Mexican_BraveryP",
    "Moshes_FavoriteF": "Moshes_FavoriteF",
    "Moshes_FavoriteP": "Moshes_FavoriteP",
    "Custom": "Custom",
}

def _price_from_type(ptype: str) -> float | None:
    if not ptype:
        return None
    ptype = TYPE_ALIASES.get(ptype, ptype)
    cls = getattr(pizza_types, ptype, None)
    if cls is None:
        return None
    try:
        return float(cls().price)
    except Exception:
        return None

def compute_totals(order_obj: dict):
    order = (order_obj or {}).get("order", {}) or {}
    items = order.get("items", {}) or {}

    subtotal = 0.0
    lines = []

    for key, value in items.items():
        if isinstance(value, dict):
            name = key
            ptype = value.get("type", "")
            qty = int(value.get("qty") or value.get("quantity") or 1)
            price = _price_from_type(ptype)
            if price is None:
                price = float(value.get("price", 0) or 0)

            line_total = price * qty
            subtotal += line_total
            lines.append({
                "name": name,
                "type": ptype,
                "qty": qty,
                "price": price,
                "total": line_total
            })
        elif isinstance(value, list):
            for idx, it in enumerate(value, 1):
                it = dict(it or {})
                name = f"{key}"
                ptype = it.get("type", "")
                qty = int(it.get("qty") or it.get("quantity") or 1)
                price = _price_from_type(ptype)
                if price is None:
                    price = float(it.get("price", 0) or 0)

                line_total = price * qty
                subtotal += line_total
                lines.append({
                    "name": name,
                    "type": ptype,
                    "qty": qty,
                    "price": price,
                    "total": line_total
                })
        else:
            lines.append({"name": key, "type": "", "qty": 1, "price": 0.0, "total": 0.0})

    tip = float(order.get("tip", 0) or 0)
    total = subtotal + tip
    return subtotal, tip, total, lines


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

@app.route('/home/')
def home_page():
    return render_template('index.html')


@app.post('/order/place-order')
def place_order():
    order_id = random.randint(100000, 999999)
    data = request.get_json()
    data['id'] = order_id
    data['timestamp'] = timestamp

    with open(order_storage, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    orders_name = "orders"
    os.makedirs(orders_name, exist_ok=True)
    file_path = os.path.join(orders_name, f"order_{order_id}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    logger.log(f"New order placed: id={order_id}, {timestamp}")
    orders.append(data)
    try:
        subtotal, tip, total, _ = compute_totals(data)
        customer_name = (data.get("order", {}) or {}).get("customer_name", "Guest")
        inv = Invoice(
            external_order_id=str(order_id),
            customer=customer_name,
            subtotal=subtotal,
            tip=tip,
            total=total,
            json=json.dumps(data, ensure_ascii=False)
        )
        db.session.add(inv)
        db.session.commit()
        logger.log(f"Invoice saved to DB: db_id={inv.id}, order_id={order_id}, total={total}")
    except Exception as e:
        logger.log(f"DB save failed for order_id={order_id}: {e}")
    if data["order"]["order_type"] == "dine-in":
        return redirect('/tables/new-table/', code=307)
    else:
        return redirect('/admin/order/pizza', code=307)


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

@app.route('/login/<name>')
def logon(name):
    if name in data.admins:
        return redirect('/admin/', code=302)
    else:
        return redirect('/users/', code=302)
    
@app.get('/invoices/db')
def invoices_db_list():
    rows = Invoice.query.order_by(Invoice.id.desc()).limit(20).all()
    return jsonify([
        {
            "id": r.id,
            "external_order_id": r.external_order_id,
            "customer": r.customer,
            "subtotal": r.subtotal,
            "tip": r.tip,
            "total": r.total,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in rows
    ]), 200
from flask import send_from_directory

@app.route('/favicon.ico')
def favicon():
    try:
        return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico')
    except Exception:
        return ('', 204)


from sqlalchemy import text, inspect

@app.get('/debug/db-info', endpoint='debug_db_info_v2')
def debug_db_info():
    from sqlalchemy import text
    eng = db.engine
    with eng.connect() as conn:
        cnt = conn.execute(text("SELECT COUNT(*) FROM invoices")).scalar()
    return jsonify({"db_path": str(eng.url), "count_invoices": int(cnt)}), 200

@app.get('/debug/counts', endpoint='debug_counts_v2')
def debug_counts():
    from sqlalchemy import text
    with db.engine.connect() as conn:
        cnt = conn.execute(text("SELECT COUNT(*) FROM invoices")).scalar()
    return jsonify({"invoices": int(cnt)}), 200





if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
