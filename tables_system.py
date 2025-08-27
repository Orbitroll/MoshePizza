## pulling data from json, if order_type == sitting then:
##create a new object with the Table class with the relevant parameters.


class Table:
    table_instances = 0
    max_instances = 20
    def __init__(self, seat_num: int, table_num: int, time:dict, date:dict, customer:str):
        
        if Table.table_instances >= Table.max_instances:
            raise OverflowError('No available table')
        else:
            self.seat_num = seat_num
            self.table_num = table_num
            self.time = time
            self.date = date
            self.customer = customer
            table_instances += 1 
            return table_instances
    
    def __del__(self):
        Table.table_instances -= 1






