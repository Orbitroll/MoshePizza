from flask import Flask, Blueprint, request, jsonify, redirect, url_for,render_template
from classes import Order
from table_class import Table

tables_bp = Blueprint('tables_bp', __name__)

@tables_bp.post('order/new_table')
def new_table():
    data = Order.load_order
    table_num = data["order"]["table"]
    timestamp = data["order"]["timestamp"]
    customer = data["customer_name"]
    waiter = None
    is_taken = None

    globals()[f"table_{table_num}"] = Table(table_num= table_num, timestamp=timestamp, customer= customer, waiter= waiter, is_taken= is_taken)



@tables_bp.get('/order/table-<int:table_id>')
def table_show(table_id):
    pass