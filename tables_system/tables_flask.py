from flask import Flask, Blueprint, request, jsonify, redirect, url_for,render_template
from tables_system.table_class import Table
from pathlib import Path
import os, json
from data import order_storage



def load_order():
        if not order_storage.exists():
            return None
        try:
            with open(order_storage, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None

tables_bp = Blueprint('tables_bp', __name__)


@tables_bp.post('/new-table/')
def new_table():
    data = load_order()
    if (data["order"]["table"]) == "Irrelevant" or (data["order"]["order_type"]) != "dine-in" :
         print('Order does not require a table.')
         return 'Order does not require a table.'
    else:
        table_num = int(data["order"]["table"])
        timestamp = data["timestamp"]
        customer = data["order"]["customer_name"]
        waiter = None
        is_taken = None

        table_name =  f"table_{table_num}"
        globals()[table_name] = Table(table_num= table_num, timestamp=timestamp, customer= customer, waiter= waiter, is_taken= is_taken)
        data_dict = globals()[table_name].to_dict()

        tables_name = "used_tables"
        os.makedirs(tables_name, exist_ok=True)
        file_path = os.path.join(tables_name, f"table_{table_num}.json")
        with open(file_path, "w") as f:
            json.dump(data_dict, f, indent=4)
        return 'Table created successfully'


@tables_bp.get('/order/table-<int:table_id>')
def table_show(table_id):
    pass