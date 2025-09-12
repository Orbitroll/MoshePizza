from data import order_storage
from flask import Flask, Blueprint, request, jsonify, redirect, url_for,render_template
import json
import pizza_types
import os
import pypandoc

invoices_bp = Blueprint('invoices_bp', __name__)

def load_order():
        if not order_storage.exists():
            return None
        try:
            with open(order_storage, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None



def dynamic_chart():
     initial_chart = """
| NM.| Item| Price| QTY.| TOTAL|
| --- | --- | --- | --- | ---   
"""
     rows = []
     i = 1
     for key,item in load_order()["order"]["items"].items():
          pizza_class = getattr(pizza_types,item["type"])()
          rows.append(f"|{i}|{key}, {item['type']}:{item['topping']}|{pizza_class.price} NIS|1|{pizza_class.price} NIS|")        
       
          i +=1
     return initial_chart + "\n".join(rows)




@invoices_bp.route('/new-md/', methods= ['POST'], strict_slashes = False)
def create_md():
    load_order()
    order_data = load_order()  
    order_chart = dynamic_chart()    
    order_date = order_data["timestamp"]["date"]
    order_time = order_data["timestamp"]["time"]
    customer_name = order_data["order"]["customer_name"]
    payment_method = order_data["order"]["payment"]["method"]
    card = order_data["order"]["payment"]["card"]
    order_id = order_data["id"]


    invoice_md = f"""

# ![](static/assets/logo_receipt.png)Pizza Moshe Yavne

### The Most Advanced Pizzeria in The World

#### Derekh Shamur Street 42, Yavne, Israel

---

**Date**: { '.'.join(str(number) for number in order_date.values())}  
**Time**: { ':'.join(str(number) for number in order_time.values())}  
**Issued to**: {customer_name}  
**Form of Payment:** {payment_method}{(f':{card}') if payment_method == 'card' else''}  
**Order ID**: {order_id}  

**Items**:

{order_chart}

**Subtotal**: 105 NIS  
**Tip (Not Included)**: 15 NIS  
**TOTAL**: **120 NIS**  

---

**Thank you for visiting us! Another visit from you is another shekel taken from corporations.**
**Call us! - 0526664181**

"""

    invoices_name = "invoices"
    os.makedirs(invoices_name, exist_ok=True)
    file_path = os.path.join(invoices_name, f"invoice_{order_id}.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(invoice_md)
    pdf_path = os.path.join(invoices_name, f"invoice_{order_id}.pdf")
    pypandoc.convert_file(f"{file_path}",'pdf',outputfile= f"{pdf_path}", extra_args= ['--standalone']),

    return 'invoice created successfully'


        