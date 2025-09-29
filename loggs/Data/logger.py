import datetime

class Logger:
    def __init__(self, file):
        self.file = open(file, 'a+', encoding='utf-8')

    def log(self, message: str):
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.file.write(f"[{now}] {message}\n")
        self.file.flush()

    def close(self):
        self.file.close()