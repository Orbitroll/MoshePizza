import json
import os
from main import Pizza
from flask import Flask, request, jsonify, redirect, url_for


class CustomPizza(Pizza):
     def __init__(self, size: str = "small", crust: str = "thin", topping: list | None = None):
        self.size = size
        self.crust = crust
        self.topping = topping or []




