from flask import Blueprint , jsonify

users_bp = Blueprint('users_bp', __name__)

@users_bp.route('/')
def costumer():
    return f'welcome to Pizza Moshe'

