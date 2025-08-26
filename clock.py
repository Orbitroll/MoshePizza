
import datetime

now = datetime.datetime.now()


recieved = {"date": {"day":now.day, "month":now.month, "year": now.year}, "time": {"hour":now.hour, "minutes":now.minute, "seconds":now.second}}



while True:
     print(recieved["time"]["hour"], recieved["time"]["minutes"], recieved["time"]["seconds"])
