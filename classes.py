import requests

# from main import Pizza

geo_search = "https://geocoding-api.open-meteo.com/v1/search"
get_temperature = "https://api.open-meteo.com/v1/forecast"
recipe = {}
weather_recepie = {}


class Yavne_weather:
    def city(self, name: str, country_code: str | None = None):
        weather = requests.get(
            geo_search,
            params={"name": name, "country_code": country_code},
            timeout=10
        )
        if weather.status_code != 200:
            return {"error": f"Request failed with {weather.status_code}"}
        weather_data = weather.json()
        results = weather_data.get("results") or []
        if not results:
            return {"error": f' no results for place:{name}'}
        if country_code:
            filtered = [r for r in results if r.get("country_code") == country_code]
            results = filtered or results
        r = results[0]
        return {
            "name": r.get("name"),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "timezone": r.get("timezone"),
            "country": r.get("country"),
            "country_code": r.get("country_code"),
        }

    def temperature(self, name: str, country_code: str | None = None):
        locate_city = self.city(name, country_code)
        city_temperature = requests.get(
            get_temperature,
            params={
                "latitude": locate_city["latitude"],
                "longitude": locate_city["longitude"],
                "current": "temperature_2m,relative_humidity_2m",
                "timezone": locate_city["timezone"]
            },
            timeout=10
        )
        if city_temperature.status_code != 200:
            return {"error": f"Forecast failed with {city_temperature.status_code}"}
        data = city_temperature.json()
        cur = (data.get("current") or {})
        return {
            "source": "open-meteo",
            "place": {
                "name": locate_city["name"],
                "country": locate_city["country"],
                "timezone": locate_city["timezone"]
            },
            "current": {
                "temp_c": cur.get("temperature_2m"),
                "humidity_pct": cur.get("relative_humidity_2m")
            }
        }


class NeapolitanPizza:
    def dough_instruction(self, temp_c, humidity_pct):
        hydration = 62.0
        salt = 2.8
        yeast = 0.08

        if temp_c >= 26:
            hydration -= 1.0
        if humidity_pct >= 65:
            hydration -= 0.5
        if temp_c >= 28:
            salt = 3.0

        if temp_c > 24:
            yeast *= (1 - 0.15 * ((temp_c - 24) // 3))
        elif temp_c < 20:
            yeast *= (1 + 0.15 * ((20 - temp_c) // 3))

        return hydration, salt, yeast

    def dough(self, ball_weight=270, temp_c=24, humidity_pct=60):
        hydration, salt, yeast = self.dough_instruction(temp_c, humidity_pct)
        H, S, Y = hydration / 100, salt / 100, yeast / 100
        flour = ball_weight / (1 + H + S + Y)
        water = flour * H
        salt_g = flour * S
        yeast_g = flour * Y
        return {
            "weather": {"temp_c": temp_c, "humidity_pct": humidity_pct},
            "recipe": {
                "hydration_pct": hydration,
                "salt_pct": salt,
                "yeast_pct": yeast
            },
            "Kitchen_instruction": {
                "flour_g": round(flour, 2),
                "water_g": round(water, 2),
                "salt_g": round(salt_g, 2),
                "yeast_g": round(yeast_g, 2),
                "total_dough_g": round(flour + water + salt_g + yeast_g, 2)
            }
        }


class Pizza:
    def __init__(self, size: str = "small", crust: str = "thin", topping: list | None = None):
        self.size = size
        self.crust = crust
        self.topping = topping or []

    def add_topping(self, topping: str):
        if topping not in self.topping:
            self.topping.append(topping)

    def to_dict(self):
        return {
            "size": self.size,
            "crust": self.crust,
            "topping": self.topping if self.topping else ["regular pizza , noob"]
        }

    def __str__(self):
        return f"{self.size} pizza , {self.crust} {self.topping if self.topping else 'regular pizza , noob'}"

# yavne = Yavne_weather()
# temperature = yavne.temperature("Yavne", "IL")["current"]["temp_c"]
# humidity = yavne.temperature('yavne', 'IL')["current"]["humidity_pct"]
# print(humidity)
# print(temperature)
