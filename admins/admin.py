from flask import Blueprint, jsonify
from classes import Yavne_weather, NeapolitanPizza

admin_bp = Blueprint('admin_bp', __name__)


@admin_bp.get('/Kitchen_bon')
def make_dough():
    weather = Yavne_weather()
    current = weather.temperature("Yavne", "IL")["current"]

    pizza = NeapolitanPizza()
    recipe = pizza.dough(
        ball_weight=300,
        temp_c=current["temp_c"],
        humidity_pct=current["humidity_pct"]
    )
    return jsonify(recipe), 200


@admin_bp.route('/')
def admin():
    return f'welcome sadmin'
