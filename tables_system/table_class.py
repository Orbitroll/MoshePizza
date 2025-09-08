
from data import takent_json

class Table:
    table_instances = 0
    max_instances = 20
    tables_taken = []
    tables_waiters = {"Ron":0, "Shlomi":0, "Muhammad":0, "Moshe":0}
    available_waiters = []
    
    def tables_take():
         

    def available_w():
         Table.available_waiters.clear()
         for k, v in Table.tables_waiters.items():
              if v < 5:
                    Table.available_waiters.append(k)
                        
                                 


    def taken_table(self):

            if self.table_num > 20 or self.table_num < 1 or self.table_num in Table.tables_taken:
                self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, please choose another table from 1-20:'))
                if self.table_num > 20 or self.table_num < 1 or self.table_num in Table.tables_taken:
                    while self.table_num > 20 or self.table_num < 1 or self.table_num in Table.tables_taken :
                        self.table_num = int(input('The table you chose is taken, larger than 20, or smaller than 1, try again:'))

            else:
                self.is_taken = True
                Table.tables_taken.append(self.table_num) 
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
        self.choose_waiter()
        
    
    def clear_table(self):
        Table.table_instances -= 1
        self.is_taken = False
        Table.tables_taken.remove(self.table_num)
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

    






