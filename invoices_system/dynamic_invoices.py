from data import order_storage
from flask import Flask, Blueprint, request, jsonify, redirect, url_for,render_template
import json
import pizza_types
import os
import pypandoc
from prices import items

invoices_bp = Blueprint('invoices_bp', __name__)

milkshakes = items['milkshakes']
soft_drinks = items['soft_drinks']
toppings = items['toppings']


def load_order():
        if not order_storage.exists():
            return None
        try:
            with open(order_storage, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None



def dynamic_chart(chart):
     initial_chart = """
| NM.| Item|Details| Price| QTY.| TOTAL|
| --- | --- | --- | --- | --- | ---  
"""
     rows = []
     i = 1
     subtotal = 0
     toppings_price = 0
     for key,item in load_order()["order"]["items"].items():     
          if "topping" in item:
               for toppings, price in items['toppings'].items():
                    for order_topping in item['topping']:
                        if order_topping == toppings:
                            toppings_price += price
                         
          pizza_class = getattr(pizza_types,item["type"])() if key == 'pizza' else None
          rows.append(f"|{i}|{key.replace('_', ' ').title()}, {item['type'].replace('_', ' ').title()}|{('<br> ,'.join(item['topping']).title()) if hasattr(pizza_types, item['type']) else ''}|{pizza_class.price + toppings_price if hasattr(pizza_types, item['type']) else item['price']} NIS|{1 if hasattr(pizza_types, item['type']) else item['quantity']}|{pizza_class.price + toppings_price if hasattr(pizza_types, item['type'])  else item['price']* item['quantity']}  NIS|")        
       
          i +=1
          subtotal += (pizza_class.price + toppings_price)  if hasattr(pizza_types, item['type'])  else (item['price']* item['quantity'])
     if chart:
        return initial_chart + "\n".join(rows)
     else:
          return subtotal




@invoices_bp.route('/new-md/', methods= ['POST'], strict_slashes = False)
def create_md():
    load_order()
    order_data = load_order()  
    order_chart = dynamic_chart(True)    
    order_date = order_data["timestamp"]["date"]
    order_time = order_data["timestamp"]["time"]
    customer_name = order_data["order"]["customer_name"]
    payment_method = order_data["order"]["payment"]["method"]
    card = order_data["order"]["payment"]["card"]
    order_id = order_data["id"]
    tip = order_data["order"]["tip"]
    subtotal = dynamic_chart(False)
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

**Subtotal**: {subtotal} NIS  
**Tip (Not Included)**: {tip} NIS  
**TOTAL**: **{subtotal + tip} NIS**  

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


        