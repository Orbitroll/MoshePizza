import json
from main import _Pizza
from flask import request

with open:
    order = json.load("order.json")

print(order[id])

class CustomPizza(_Pizza):
    def __init__(self, size, crust, topping = None):
        super().__init__(size, crust, topping)





#idea for logic - json to python, will implement later.

if CustomPizza:
    globals()["custompizza" + order[id]] = Pizza("size","crust","topping") 
    