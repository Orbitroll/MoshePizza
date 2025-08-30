## pulling data from json, if order_type == sitting then:
##create a new object with the Table class with the relevant parameters.


class Table:
    table_instances = 0
    max_instances = 20
    tables_taken = []

    def taken_table(self):
            if self.table_num > 20 or self.table_num < 1 or self.table_num in Table.tables_taken:
                self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, please choose another table from 1-20:'))
                if self.table_num > 20 or self.table_num < 1 or self.table_num in Table.tables_taken:
                    while self.table_num > 20 or self.table_num < 1 or self.table_num in Table.tables_taken :
                        self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, try again:'))

            self.is_taken = True
            Table.tables_taken.append(self.table_num) 
            Table.table_instances += 1 

    
    def __init__(self, table_num: int, time:dict, date:dict, customer:str, waiter:str, is_taken:bool = None):
        
        if Table.table_instances >= Table.max_instances:
            raise OverflowError('No available table')
        
        else:
            self.table_num = table_num
            self.time = time
            self.date = date
            self.customer = customer
            self.waiter = waiter
            self.is_taken = is_taken

        self.taken_table()
        
            
    
    def __del__(self):
        Table.table_instances -= 1
        self.is_taken = False
        Table.tables_taken.remove(self.table_num)

