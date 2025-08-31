import datetime

class Logger:
    file = None
    def __init__(self,file):
        Logger.file=open(file,'a+')

    def log(self):
        Logger.log(f'{datetime.datetime.now().hour}:{datetime.datetime.now().minute} {data}')
