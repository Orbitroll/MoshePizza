from flask import Flask,request,jsonify

app = Flask('Pizza Moshe')

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
    data=request.get_json()
    size = data.get("size", "small")
    crust = data.get("crust", "thin")
    topping = data.get("topping", [])

    pizza = _Pizza(size,crust,topping)

    return jsonify(pizza.to_dict()), 201

