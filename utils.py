from main import Pizza
import requests

geo_search = "https://geocoding-api.open-meteo.com/v1/search"
get_temperature = "https://api.open-meteo.com/v1/forecast"


class Yavne_weather:
    def city(self , name: str, country_code: str | None = None):
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
