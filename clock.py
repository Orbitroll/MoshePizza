
import datetime

now = datetime.datetime.now()


timestamp = {"date": {"day":now.day, "month":now.month, "year": now.year}, "time": {"hour":now.hour, "minutes":now.minute, "seconds":now.second}}



while True:
     print(timestamp["time"]["hour"], timestamp["time"]["minutes"], timestamp["time"]["seconds"])
