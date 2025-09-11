from data import order_storage
from flask import Flask, Blueprint, request, jsonify, redirect, url_for,render_template
import json
import pizza_types

def load_order():
        if not order_storage.exists():
            return None
        try:
            with open(order_storage, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None

order_data = load_order()        


def dynamic_chart():
     initial_chart = """
     | NM.| Item| Price| QTY.| TOTAL|
    | --- | --- | --- | --- | ---   
"""
     for item in order_data["order"]["item"]:
          i = 1
          row =f""" 
          |{i}|{item},{item["type"]}|{item["type"]}| |  
"""

order_date = order_data["timestamp"]["date"]
order_time = order_data["timestamp"]["time"]
customer_name = order_data["order"]["customer_name"]
order_id = order_data["id"]


invoice_md = f"""

# ![](static/assets/logo_receipt.png)Pizza Moshe Yavne

### The Most Advanced Pizzeria in The World

#### Derekh Shamur Street 42, Yavne, Israel

---

**Date**: { '.'.join(str(number) for number in order_date.values())}  
**Time**: { ':S'.join(str(number) for number in order_time.values())}  
**Issued to**: {customer_name}  
**Form of Payment:** **Cash**  
**Order ID**: {order_id}  
  
**Items**:

| NM.| Item| Price| QTY.| TOTAL|
| --- | --- | --- | --- | ---
|1  |Pepperoni Pizza  |80 NIS |1 | 80 NIS
| 2 |Oreo Milkshake L  |25  NIS  |1 |25 NIS


**Subtotal**: 105 NIS  
**Tip (Not Included)**: 15 NIS  
**TOTAL**: **120 NIS**  
  
---

**Thank you for visiting us! Another visit from you is another shekel taken from corporations.**
**Call us! - 0526664181**

"""




invoices_bp = Blueprint('invoices_bp', __name__)

@invoices_bp.post('/new-md/')
def new_md():
     pass