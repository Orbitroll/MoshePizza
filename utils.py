inventory_pizza_ingredents= {
    'flour':500 ,#cups of flour
    'garlic':20, #units if garlic
    'tomato_can':20,
    "cheese":25 #1 unit per chesse
}

def dough_available():
    return inventory_pizza_ingredents['flour']/3
def tomato_paste_available():
    amount_galic = inventory_pizza_ingredents['garlic'] / .5
    amount_tomato_can = inventory_pizza_ingredents['tomato_can'] / .25
    return min(amount_galic, amount_tomato_can)

inventory_basic_pizza = {
#    "dough": ,
 #   "tomato_paste": ,

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
    if inventory_basic_pizza["dough"] >= 1 and inventory_basic_pizza["tomato_paste"] >= 1 and inventory_basic_pizza[
        "cheese"] >= 1:
        inventory_basic_pizza["dough"] -= 1
        inventory_basic_pizza["tomato_paste"] -= 1
        inventory_basic_pizza["cheese"] -= 1

        print(" Pizza made successfully!")
    else:
        print(" Not enough ingredients to make a pizza contact the supplier.")



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

##