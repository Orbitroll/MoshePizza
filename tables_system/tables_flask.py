from flask import Flask, Blueprint, request, jsonify, redirect, url_for,render_template
from tables_system.table_class import Table
from pathlib import Path
import os, json
from data import order_storage, takent_json, waiters_json
import data


def load_order():
        if not order_storage.exists():
            return None
        try:
            with open(order_storage, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None

def load_table():
        table_num = int(load_order()["order"]["table"])
        table_name =  f"table_{table_num}"
        file_path = os.path.join("used_tables", f"{table_name}.json")
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
        
def load_taken():
        if not takent_json.exists():
            return None
        try:
            with open(takent_json, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None     

def load_waiters():
    if not waiters_json.exists():
        return None
    try:
        with open(waiters_json, "r", encoding="utf-8") as f:
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
        #if table number was switched due to taken_table()
        if table_num != globals()[table_name].table_num:
             #load the old table from the saved jsons
             old_table = load_table()
             changed_num = int(globals()[table_name].table_num)
             chosen_waiter = (globals()[table_name].waiter)
             new_name = f"table_{changed_num}"
             globals()[f"{new_name}"] = Table(table_num= changed_num, timestamp=timestamp, customer= customer, waiter= chosen_waiter, is_taken= is_taken)
             t = globals()[table_name]
             t.table_num = old_table["table_num"]
             t.timestamp = old_table["timestamp"]
             t.customer = old_table["customer"]
             t.waiter = old_table["waiter"]
             t.is_taken = old_table["is_taken"]

             Table.add_tableinst()
             table_name = new_name
        
        data["order"]["table"] = int(globals()[table_name].table_num)
        with open(order_storage, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        file_path = os.path.join('orders', f"order_{data['id']}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        data_dict = globals()[table_name].to_dict()

        tables_name = "used_tables"
        os.makedirs(tables_name, exist_ok=True)
        file_path = os.path.join(tables_name, f"{table_name}.json")
        with open(file_path, "w") as f:
            json.dump(data_dict, f, indent=4)
        return redirect('/admin/order/pizza', code = 307)


@tables_bp.delete('/delete-table/<int:table_name>')
def table_delete(table_name):
        Table.clear_table(table_name)
        return 'Table cleared successfully'
     
@tables_bp.get('/free-tables')
def free_tables():
        free_data = Table.display_free()
        return jsonify({"free_tables": free_data})

@tables_bp.get('/table-<int:table_num>')
def table_show(table_num):
    pass