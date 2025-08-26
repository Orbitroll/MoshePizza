import json
from main import Pizza
from flask import Flask, request, jsonify, redirect, url_for

with open:
    order = json.load("order.json")

print(order[id])

class CustomPizza(Pizza):
    def __init__(self, size, crust, topping = None):
        super().__init__(size, crust, topping)





#idea for logic - json to python, will implement later.

##if CustomPizza:
    ##globals()["custompizza" + order[id]] = Pizza("size","crust","topping") 
    