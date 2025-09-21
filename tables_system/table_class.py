
from data import takent_json, waiters_json, tableinst_json
import json
import re
import os

class Table:
    max_instances = 20
    available_waiters = []

    def load_table(table):
            table_name =  f"table_{table}"
            file_path = os.path.join("used_tables", f"{table_name}.json")
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)

    def add_tableinst():
        with open(tableinst_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data[0] < 20:
                data[0] += 1
            else:
                raise OverflowError("All the tables are taken, talk to Moshe")
            with open(tableinst_json, "w", encoding="utf-8") as f:
                json.dump(data, f)
    
    def clear_tableinst():
        with open(tableinst_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            data[0] -= 1
            with open(tableinst_json, "w", encoding="utf-8") as f:
                json.dump(data, f)
    
    def display_tableinst():
        with open(tableinst_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data[0]

    table_instances = display_tableinst()

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

    def waiters_add(waiter):
        with open(waiters_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            data[waiter] += 1 
        with open(waiters_json, "w", encoding="utf-8") as f:
            json.dump(data, f)
    
    def waiters_free(waiter):
        with open(waiters_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            data[waiter] -= 1
        with open(waiters_json, "w", encoding="utf-8") as f:
            json.dump(data, f)
                        
    def load_taken():
        if not takent_json.exists():
            return None
        try:
            with open(takent_json, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None     
    
    def load_waiters():
        if not waiters_json.exists():
            return None
        try:
            with open(waiters_json, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None        

    def available_w():
         waiters_data = Table.load_waiters()
         Table.available_waiters.clear()
         for k, v in waiters_data.items():
              if v < 5:
                    Table.available_waiters.append(k)

    def taken_table(self):
            taken_data = Table.load_taken()


            if self.table_num > 20 or self.table_num < 1 or self.table_num in taken_data:
                self.table_num = int(input('The table the customer chose is taken, larger than 20, or smaller than 1, please choose another table from 1-20:'))
                if self.table_num > 20 or self.table_num < 1 or self.table_num in taken_data:
                    while self.table_num > 20 or self.table_num < 1 or self.table_num in taken_data :
                        self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, try again:'))

            else:
                self.is_taken = True
                Table.tables_taken(self.table_num) 
                Table.add_tableinst()

    def choose_waiter(self):
         waiters_data = Table.load_waiters()
         Table.available_w()
         
         if Table.available_waiters == []:
              print('No available waiter, talk to Moshe')
              return
         
         else:
            waiter = input('Choose a waiter to serve this table:').strip().title()
            while waiter not in waiters_data:
                Table.available_w()
                waiter = input(f'Waiter does not exist, choose the following waiters:{",".join(Table.available_waiters)}').strip().title()
            while waiter not in Table.available_waiters:
                Table.available_w()
                waiter = input(f'Waiter not available, try these waiters instead:{",".join(Table.available_waiters)}').strip().title()
                if Table.available_waiters == []:
                    print('No available waiter, talk to Moshe')
                    return
                if waiter not in waiters_data or waiter not in Table.available_waiters:
                    Table.available_w()
                    print(f'Waiter does not exist or is not available, choose the following waiters:{",".join(Table.available_waiters)}')
                    continue

            Table.waiters_add(waiter)     
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
        if self in globals() or f"table_{self}" in globals():
            Table.clear_tableinst()
            self.is_taken = False
            Table.taken_del(self.table_num)
            Table.waiters_free(self.waiter)
            self.waiter = None
            self.timestamp = None
            self.customer = None
        else:
            s = f"{self}"
            match = re.search(r"\d+", s)
            if match:
                num = int(match.group())
            data = Table.load_table(num)
            Table.clear_tableinst()
            Table.taken_del(num)
            Table.waiters_free(data['waiter'])



    def to_dict(self):
            return {
                "table_num": self.table_num,
                "timestamp": self.timestamp,
                "customer":self.customer,
                "waiter":self.waiter,            
            }

    def display_free():
        free_tables = []
        taken = Table.load_taken()
        for i in range(1,21):
            if i not in taken:
                free_tables.append(i)               
        return free_tables


    






