print('Welcome to Moshe Pizza!')
name = input('Please enter your name: ')
order = input(f'Dear {name},where do you want to sit? : ')
while not 'inside' in order and not 'outside' in order:
    order = input(f'Dear {name},please tell me where you want to sit? : ')