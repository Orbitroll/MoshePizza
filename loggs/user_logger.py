from datetime import datetime, timedelta

admin_users = ["Moshe", "Shlomi", "Mohammed", "Ron"]

class User:
    def __init__(self, username, password, role) -> None:
        self.username = username
        self.password = password
        self.role = role
        self.orders = []  # store datetime of each order

    def add_order(self, price: float) -> float:
        
        self.orders.append(datetime.now())

        if self.is_frequent():
            discount = price * 0.10
            final_price = price - discount
            print(f"Hi {self.username}, Thanks for choosing us again! You got a discount of {discount:.2f}₪.")
            return final_price
        else:
            return price

    def is_frequent(self) -> bool:
        
        now = datetime.now()
        one_month_ago = now - timedelta(days=30)
        recent_orders = [o for o in self.orders if o >= one_month_ago]
        return len(recent_orders) >= 3


def login():
    print('Welcome to Moshe Yavne Pizza the best pizza in Yavne')
    print('Please log in')
    print("if you don’t have a username press enter to continue as guest")

    username = input("Enter your username: ")
    password = input("Enter your password: ")

    
    if username == "" and password == "":
        return User("guest", "guest", "guest")

    
    if username in admin_users:
        return User(username, password, "admin")

    
    return User(username, password, "user")
