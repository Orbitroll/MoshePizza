## pulling data from json, if order_type == sitting then:
##create a new object with the Table class with the relevant parameters.


class Table:
    table_instances = 0
    max_instances = 20
    def __init__(self, table_num: int, time:dict, date:dict, customer:str):
        
        if Table.table_instances >= Table.max_instances:
            raise OverflowError('No available table')
        else:
            self.table_num = table_num
            self.time = time
            self.date = date
            self.customer = customer
            table_instances += 1
    
    def __del__(self):
        Table.table_instances -= 1






