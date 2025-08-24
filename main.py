import abc
class _Pizza(classmethod):
    def __init__(self, size: str, crust: str, topping: list = None):
        self.size = size
        self.crust = crust
        self.topping = topping if topping else []

    def add_topping(self, topping: str):
        if topping not in self.topping:
            self.topping.append(topping)

    def __str__(self):
        return f' {self.size} pizza , {self.crust} {self.topping if self.topping else 'regular pizza , noob'}'

