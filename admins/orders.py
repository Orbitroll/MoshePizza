from classes import Order
from data import orders_dir ,order_storage

order_mgr = Order(order_storage=order_storage, orders_dir=orders_dir)

def load_order():
    return order_mgr.load_order()


def order_fetch(url_id: int):
    return order_mgr.order_fetch(url_id)
