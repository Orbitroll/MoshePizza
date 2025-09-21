from pathlib import Path


orders = []
admins = ['Ron', 'Mohammad', 'Moshe', 'Shlomi']
json_dir = Path(__file__).resolve().parent / "jsons"
temp_dir = Path(__file__).resolve().parent / "temp_pizzas"
pages_dir = Path(__file__).resolve().parent / "templates"
tables_dir = Path(__file__).resolve().parent / "used_tables"
orders_dir = Path(__file__).resolve().parent / "orders"
order_storage = json_dir / "order.json"
order_page = pages_dir / "order.html"
table_jsons = Path(__file__).resolve().parent / "tables_system"/"jsons"
takent_json = table_jsons / "tables_taken.json"
waiters_json = table_jsons / "tables_waiters.json"
tableinst_json = table_jsons /"table_instances.json"
invoice_path = Path(__file__).resolve().parent / "invoices"