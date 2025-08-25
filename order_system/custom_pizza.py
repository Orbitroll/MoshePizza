from main import Pizza
from flask import request

class CustomPizza(Pizza):
    def __init__(self, size, crust, topping = None):
        super().__init__(size, crust, topping)





#idea for logic - json to python, will implement later.

if CustomPizza:
    globals()["custompizza" + order[id]] = Pizza("size","crust","topping") 
    