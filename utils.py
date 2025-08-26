inventory_basic_pizza = {
    "dough": 10,        
    "tomato_paste": 8,  
    "cheese": 15        
}
inventory_toppings = {
    "olives"
    "papporni"
    "Corn"
    "jalepenios"
    "Extra Chesse"
    "Tomato"
    "Mushrooms"
}


def show_inventory():
    print("\nCurrent Pizza Inventory:")
    for item, amount in inventory_basic_pizza.items():
        print(f"{item}: {amount}")
    print()

###########
def make_pizza():
    if inventory_basic_pizza["dough"] >= 1 and inventory_basic_pizza["tomato_paste"] >= 1 and inventory_basic_pizza["cheese"] >= 1:
        inventory_basic_pizza["dough"] -= 1
        inventory_basic_pizza["tomato_paste"] -= 1
        inventory_basic_pizza["cheese"] -= 1
    
        print(" Pizza made successfully!")
    else:
        print(" Not enough ingredients to make a pizza contact the supplier.")

#תזכורת לגבי חוסר מצרכים
def restock(item, amount):
    if item in inventory_basic_pizza:
        inventory_basic_pizza[item] += amount
    else:
        print(" That ingredient doesn't exist in the inventory contact the supplier.")

# Example usage
show_inventory()
make_pizza()
show_inventory()
restock("cheese", 5)
show_inventory()