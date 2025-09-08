
from data import takent_json
import json
class Table:
    table_instances = 0
    max_instances = 20
    tables_waiters = {"Ron":0, "Shlomi":0, "Muhammad":0, "Moshe":0}
    available_waiters = []
    
    def tables_taken(table_int):
        with open(takent_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            data.append(table_int)
        with open(takent_json, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def taken_del(table_int):
        with open(takent_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            data.remove(table_int)
        with open(takent_json, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def available_w():
         Table.available_waiters.clear()
         for k, v in Table.tables_waiters.items():
              if v < 5:
                    Table.available_waiters.append(k)
                        
    def load_taken():
        if not takent_json.exists():
            return None
        try:
            with open(takent_json, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None     


    def taken_table(self):
            taken_data = Table.load_taken()


            if self.table_num > 20 or self.table_num < 1 or self.table_num in taken_data:
                self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, please choose another table from 1-20:'))
                if self.table_num > 20 or self.table_num < 1 or self.table_num in taken_data:
                    while self.table_num > 20 or self.table_num < 1 or self.table_num in taken_data :
                        self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, try again:'))

            else:
                self.is_taken = True
                Table.tables_taken(self.table_num) 
                Table.table_instances += 1 

    def choose_waiter(self):
         Table.available_w()
         
         if Table.available_waiters == []:
              print('No available waiter, talk to Moshe')
              return
         
         else:
            waiter = input('Choose a waiter to serve this table:').strip().title()
            while waiter not in Table.tables_waiters:
                Table.available_w()
                waiter = input(f'Waiter does not exist, choose the following waiters:{",".join(Table.available_waiters)}').strip().title()
            while waiter not in Table.available_waiters:
                Table.available_w()
                waiter = input(f'Waiter not available, try these waiters instead:{",".join(Table.available_waiters)}').strip().title()
                if Table.available_waiters == []:
                    print('No available waiter, talk to Moshe')
                    return
                if waiter not in Table.tables_waiters or waiter not in Table.available_waiters:
                    Table.available_w()
                    print(f'Waiter does not exist or is not available, choose the following waiters:{",".join(Table.available_waiters)}')
                    continue

            Table.tables_waiters[waiter] += 1     
            self.waiter = waiter
            
                
                
              


    
    def __init__(self, table_num:int, timestamp:dict, customer:str, waiter:str, is_taken:bool = None):
        
        if Table.table_instances >= Table.max_instances:
            raise OverflowError('No available table')
        
        else:
            self.table_num = table_num
            self.timestamp = timestamp
            self.customer = customer
            self.waiter = waiter
            self.is_taken = is_taken

        self.taken_table()

        if self.waiter != None:
            return
        else:
            self.choose_waiter()
        
    
    def clear_table(self):
        Table.table_instances -= 1
        self.is_taken = False
        Table.taken_del(self.table_num)
        Table.tables_waiters[self.waiter] -= 1 
        self.waiter = None
        self.timestamp = None
        self.customer = None
        

        

    def to_dict(self):
            return {
                "table_num": self.table_num,
                "timestamp": self.timestamp,
                "customer":self.customer,
                "waiter":self.waiter,
                "is_taken":self.is_taken
            }

    def display_free():
        free_tables = []
        for i in range(1,21):
            if i not in Table.tables_taken:
                free_tables.append(i)               
        print('tables', *free_tables, 'are free')

    






