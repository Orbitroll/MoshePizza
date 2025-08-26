from flask import Flask, request, jsonify, redirect, url_for

app = Flask('Pizza Moshe')
orders = []
admins = ['Ron', 'Mohammad', 'Moshe', 'Shlomi']


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


@app.post('/moshepizza/order/pizza')
def create_pizza():
    data = request.get_json(silent=True) or {}

    size = data.get("size", "small")
    crust = data.get("crust", "thin")
    topping = data.get("topping", [])
    if isinstance(topping, str):
        topping = [topping]
    elif not isinstance(topping, list):
        return jsonify({"error": "topping must be a list or string"}), 400

    pizza = Pizza(size, crust, topping)
    order = pizza.to_dict()
    orders.append(order)

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
    return f'welcome to Moshe Pizza'


@app.route('/moshepizza/<name>')
def logon(name):
    if name in admins:
        return redirect(url_for('admin_page'))
    else:
        return redirect(url_for('customer_page'))


if __name__ == '__main__':
    app.run(port=5000)
