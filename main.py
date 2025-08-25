from flask import Flask, request, jsonify

app = Flask('Pizza Moshe')
orders = []


class _Pizza:
    def init(self, size: str, crust: str, topping: list = None):
        self.size = size
        self.crust = crust
        self.topping = topping if topping else []

    def add_topping(self, topping: str):
        if topping not in self.topping:
            self.topping.append(topping)

    def str(self):
        return f'{self.size} pizza , {self.crust} {self.topping if self.topping else 'regular pizza , noob'}'


@app.post('/pizza')
def create_pizza():
    data = request.get_json()
    size = data.get("size", "small")
    crust = data.get("crust", "thin")
    topping = data.get("topping", [])

    pizza = _Pizza(size, crust, topping)
    orders.append(pizza.to_dict())

    return jsonify(pizza.to_dict()), 201


@app.get('/pizza')
def last_orders():
    if not orders:
        return jsonify({"message": "nothing yet"}), 200

    return jsonify(orders[-1]), 200


if __name__ == '__main__':
    app.run(port=5000, debug=True)
