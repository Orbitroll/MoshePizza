from classes import Pizza

class Custom(Pizza):

    def __init__(self, size: str = "small", crust: str = "thin", topping: list | None = None, price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping or []
        self.price = price

class Anti_VeganF(Pizza):

    def __init__(self, size = "large", crust = "thin", topping = ["pepperoni", "salami", "chicken bits"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price
        
class Anti_VeganP(Pizza):

    def __init__(self, size = "small", crust = "thin", topping = ["pepperoni", "salami", "chicken bits"], price = 0 ):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price
  
class MediterreneanF(Pizza):
    def __init__(self, size = "large", crust = "thin", topping = ["tzatziki", "olives", "cooked tomatoes", "red onions"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class MediterreneanP(Pizza):
    def __init__(self, size = "small", crust = "thin", topping = ["tzatziki", "olives", "cooked tomatoes", "red onions"], price = 0 ):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class NeapolitanF(Pizza):
    def __init__(self, size = "large", crust = "neapolitan", topping = ["basil"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class NeapolitanP(Pizza):
    def __init__(self, size = "small", crust = "neapolitan", topping = ["basil"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class Mexican_BraveryF(Pizza):
    def __init__(self, size = "large", crust = "thin", topping = ["jalapenos", "pepperoni", "chili flakes","hot sauce"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class Mexican_BraveryP(Pizza):
    def __init__(self, size = "small", crust = "thin", topping = ["jalapenos", "pepperoni", "chili flakes","hot sauce"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class Moshes_FavoriteF(Pizza):
    def __init__(self, size = "large", crust = "thin", topping = ["red onions", "broccoli", "pepperoni","extra cheese", "black olives", "corn"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price

class Moshes_FavoriteP(Pizza):
    def __init__(self, size = "small", crust = "thin", topping = ["red onions", "broccoli", "pepperoni","extra cheese", "black olives", "corn"], price = 0):
        self.size = size
        self.crust = crust
        self.topping = topping
        self.price = price