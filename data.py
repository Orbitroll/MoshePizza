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

