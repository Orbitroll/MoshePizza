from Data.db import init_db
from Data.users_db import save_user, get_user

class User:
    def __init__(self, email, password, role="user"):
        self.email = email
        self.password = password
        self.role = role
        self.orders = []  

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

def login():
    print(" Welcome to Moshe Yavne Pizza The best pizza place ")
    email = input("Enter your email (leave blank for guest): ")
    password = input("Enter your password: ")

    # Guest login
    if email == "" and password == "":
        return User("guest@guest.com", "guest", "guest")

    user_record = get_user(email)
    if user_record:
        if user_record["password"] == password:
            print(f"Welcome back, {user_record['email']} ({user_record['role']})")
            return User(user_record["email"], user_record["password"], user_record["role"])
        else:
            print("Wrong password.Try again.")
            return None

    save_user(email, password, "user")
    print(f"New account created for {email}")
    return User(email, password, "user")

if __name__ == "__main__":
    init_db()

    admin_accounts = {
        "moshe@pizza.com": "moshe123",
        "shlomi@pizza.com": "shlomi123",
        "mohammed@pizza.com": "mohammed123",
        "ron@pizza.com": "ron123"
    }
    for email, pw in admin_accounts.items():
        save_user(email, pw, "admin")

    user = login()
