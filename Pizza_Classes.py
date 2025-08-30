class Pizza:
    def __init__(self, size, price,cooktime,crust_type='thin'):
        self.size = size
        self.price = price
        self.cooktime = cooktime
        self.crust_type = crust_type
        self.toppings=[]
    def add_topping(self,topping):
        self.toppings.append(topping)
        self.price +=2
    def remove_topping(self,topping):
        self.toppings.remove(topping)
        self.price -=2
    def __str__(self):
       return  f"""Pizza(size={self.size}, price={self.price}, cooktime={self.cooktime}, crust_type={self.crust_type}, toppings={self.toppings}"""

FatAss_Pizza=Pizza(22,30,30,crust_type='thick')
pizza_for_one=Pizza(8,5,10,crust_type='thin')
Family_pizza=Pizza(16,20,15,crust_type='thin')
regular_pizza=Pizza(12,10,15,crust_type='thin')
##