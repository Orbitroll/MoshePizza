import sqlite3
from Data.db import DB_NAME

def save_user(email, password, role="user"):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO users (email, password, role) VALUES (?, ?, ?)",
        (email, password, role)
    )
    conn.commit()
    conn.close()

def get_user(email):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT email, password, role FROM users WHERE email=?", (email,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"email": row[0], "password": row[1], "role": row[2]}
    return None
