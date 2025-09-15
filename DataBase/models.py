# models.py
from DataBase.db import db
from sqlalchemy import func

class Invoice(db.Model):
    __tablename__ = "invoices"
    id = db.Column(db.Integer, primary_key=True)               
    external_order_id = db.Column(db.String(64), unique=True)   
    customer = db.Column(db.String(255), nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    tip = db.Column(db.Float, nullable=False, default=0.0)
    total = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.current_timestamp())
    json = db.Column(db.Text)  

