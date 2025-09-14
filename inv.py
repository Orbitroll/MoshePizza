inventory = {
    "milkshakes": {
        "Strawberry Milkshake": 10,
        "Oreo Milkshake": 10,
        "Banana Milkshake": 10,
        "Chocolate Milkshake": 10,
        "Hazelnut Milkshake": 10
    },
    "soft_drinks": {
        "Cola_can": 20, "Cola_bottle": 10, "Cola_1.5L bottle": 5,
        "Cola Zero_can": 20, "Cola Zero_bottle": 10, "Cola Zero_1.5L bottle": 5,
        "Fanta_can": 20, "Fanta_bottle": 10, "Fanta_1.5L bottle": 5,
        "Sprite_can": 20, "Sprite_bottle": 10, "Sprite_1.5L bottle": 5,
        "XL Energy_can": 15,
        "Tropit_pouch": 25,
        "Water_bottle": 30, "Water_1.5L bottle": 10,
        "Prigat_bottle": 15, "Prigat_1.5L bottle": 7
    },
    "toppings": {
        "olives": 50, "pepperoni": 50, "corn": 50, "jalapenos": 50,
        "extra cheese": 40, "tomato": 50, "mushrooms": 50, "onions": 50,
        "red onions": 50, "anchovy": 20, "broccoli": 30, "bell pepper": 40,
        "salami": 40, "chicken bits": 40, "tzatziki": 30, "black olives": 40,
        "basil": 30, "chili flakes": 100, "hot sauce": 100
    },
    "pizzas": {
        "fatass_pizza": 5,   # XXL
        "pizza_for_one": 10, # Small
        "party_pizza": 7,    # XL
        "family_pizza": 8    # Large
    }
}

# Low stock tracker
low_stock_items = []


def use_inventory(category, item, qty=1):
    if item not in inventory[category]:
        print(f" {item} not found in {category}.")
        return False

    if inventory[category][item] >= qty:
        inventory[category][item] -= qty
        print(f" {qty}x {item} taken. Remaining: {inventory[category][item]}")

        
        if inventory[category][item] < 5:
            warning = f" LOW STOCK ALERT: {item} has only {inventory[category][item]} left! Reorder soon."
            print(warning)
            if item not in low_stock_items:
                low_stock_items.append(item)
        return True
    else:
        print(f" Not enough {item} in stock. Available: {inventory[category][item]}")
        return False


def print_inventory():
    print(" Updated Inventory:")
    for category, items in inventory.items():
        print(f"\n{category.capitalize()}:")
        for name, qty in items.items():
            print(f"  {name}: {qty}")

    if low_stock_items:
        print(" Reorder Reminder: The following items are low in stock:")
        for item in low_stock_items:
            print(f"  {item}")