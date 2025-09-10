from classes import Pizza

class Custom(Pizza):

    def __init__(self, size: str = "small", crust: str = "thin", topping: list | None = None):
        self.size = size
        self.crust = crust
        self.topping = topping or []

class Anti_VeganF(Pizza):

    def __init__(self, size = "large", crust = "thin", topping = ["pepperoni", "salami", "chicken bits"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class Anti_VeganP(Pizza):

    def __init__(self, size = "small", crust = "thin", topping = ["pepperoni", "salami", "chicken bits"]):
        self.size = size
        self.crust = crust
        self.topping = topping
  
class MediterreneanF(Pizza):
    def __init__(self, size = "large", crust = "thin", topping = ["tzatziki", "olives", "cooked tomatoes", "red onions"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class MediterreneanP(Pizza):
    def __init__(self, size = "small", crust = "thin", topping = ["tzatziki", "olives", "cooked tomatoes", "red onions"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class NeapolitanF(Pizza):
    def __init__(self, size = "large", crust = "neapolitan", topping = ["basil"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class NeapolitanP(Pizza):
    def __init__(self, size = "small", crust = "neapolitan", topping = ["basil"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class Mexican_BraveryF(Pizza):
    def __init__(self, size = "large", crust = "thin", topping = ["jalapenos", "pepperoni", "chili flakes","hot sauce"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class Mexican_BraveryP(Pizza):
    def __init__(self, size = "small", crust = "thin", topping = ["jalapenos", "pepperoni", "chili flakes","hot sauce"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class Moshes_FavoriteF(Pizza):
    def __init__(self, size = "large", crust = "thin", topping = ["red onions", "broccoli", "pepperoni","extra cheese", "black olives", "corn"]):
        self.size = size
        self.crust = crust
        self.topping = topping

class Moshes_FavoriteP(Pizza):
    def __init__(self, size = "small", crust = "thin", topping = ["red onions", "broccoli", "pepperoni","extra cheese", "black olives", "corn"]):
        self.size = size
        self.crust = crust
        self.topping = topping