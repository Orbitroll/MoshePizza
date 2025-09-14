from data import order_storage
from data import admins
from datetime import datetime, timedelta

class user:
    def __init__(self, username, password, role) -> None:
        self.username = username
        self.password = password
        self.role = role
        self.orders = []  # store datetime of each order

    def add_order(self):
        
        self.orders.append(datetime.now())

    def is_frequent(self):
        
        now = datetime.now()
        one_month_ago = now - timedelta(days=30)
        recent_orders = [o for o in self.orders if o >= one_month_ago]
        return len(recent_orders) >= 3

def login():
    print('Welcome to Moshe Yavne Pizza the best pizza in Yavne')
    print('Please log in')
    print("if you don't have a username press enter to continue as guest")
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    for user in admins:
        if user.username == username and user.password == password:
            return user
    if username == "" and password == "":
        return user("guest", "guest", "guest")
    if username  in admins:
        return user(username, password, "admin")
    else:
        return user(username, password, "user")    
    