# MoshePizza

> A personal pizza‑ordering & kitchen helper web app built with Flask.

## 📌 Overview

MoshePizza helps plan and manage pizza orders for family & friends and streamlines prep in the kitchen. It includes menu & topping presets, order logging, a dough calculator, and simple admin screens.

## ✨ Key Features

* **Order flow** – create, edit and track pizza orders.
* **Menu presets** – common pies & toppings pre‑configured (see `pizza moshe menu.md`).
* **Dough & timing helpers** – utilities and classes for dough, timers and workflow (see `Pizza_Classes.py`, `pizza_types.py`, `clock.py`).
* **Logging** – order/activity logs under `loggs/`.
* **Admin panels** – folders such as `admins/`, `users/`, `tables_system/`, and `invoices_system/` indicate basic management pages.
* **Static & templates** – UI assets under `static/` and HTML under `templates/`.
* **Data files** – JSON helpers & seed data in `jsons/`.

> NOTE: This README is based on the current repository structure. If code moves or new modules are added, update the sections below accordingly.

## 🗂️ Project Structure

```
DataBase/            # DB assets / scripts (if used)
admins/              # Admin-related views / logic
assets/              # Images, diagrams (e.g., drawio files)
bot/                 # (Optional) helper scripts/bots
invoices_system/     # Invoices pages / logic
data.py              # Data helpers / adapters
jsons/               # JSON data / seeds
loggs/               # Logs (orders, activity) – e.g., orders.log
static/              # CSS/JS/images
templates/           # Flask/Jinja templates (HTML)
users/               # User pages / logic
tables_system/       # Tables/DB-ish management screens
Pizza_Classes.py     # Core pizza classes & helpers
pizza_types.py       # Pizza types, toppings and presets
clock.py             # Timers / reminders for prep
classes.py           # Additional classes/utilities
utils.py             # Shared utilities
main.py              # App entrypoint (Flask)
```

## 🧰 Tech Stack

* **Backend:** Python (Flask)
* **Frontend:** HTML, CSS, JavaScript
* **Storage:** JSON files and/or simple DB (see `DataBase/`)

## 🚀 Getting Started (Local)

1. **Prereqs:** Python 3.10+ and Git
2. **Clone:**

   ```bash
   git clone https://github.com/Orbitroll/MoshePizza.git
   cd MoshePizza
   ```
3. **Create venv & install deps:**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt  # If missing, see Minimal Deps below
   ```
4. **Run:**

   ```bash
   python main.py
   # or, if you use FLASK_APP:
   # flask --app main run --debug
   ```
5. **Open:** [http://localhost:5000](http://localhost:5000)

### Minimal Deps (if `requirements.txt` doesn’t exist yet)

Create a `requirements.txt` with:

```
Flask>=2.3
```

Add more as your modules require.

## ⚙️ Configuration

* **Environment variables** (optional):

  * `FLASK_DEBUG=1` – enable debug
  * `PORT=5000` – change server port
* **Paths** – ensure JSON/log directories exist and the app has write permissions.

## 🧪 Sample Data

* `average pizza order.txt` – describes a typical order snapshot
* `pizza moshe menu.md` – menu presets you can tailor

## 🧾 Invoices & Tables (Optional)

If you’re using `invoices_system/` and `tables_system/`, document how to:

* Create a new invoice/table
* Where files are saved
* Any exported CSV/JSON format

## 👤 Admin & Users

* Admin pages are under `admins/`
* User‑facing logic under `users/`
* Add a note here if you use auth (session / simple login) and how to add admins

## 🧮 Dough & Timing Helpers

Document your go‑to formulas here (hydration %, salt, yeast) and typical timing routines.

## 🗺️ Roadmap

* [ ] Add screenshots/GIFs of the UI
* [ ] Expand tests
* [ ] Package Docker support (`Dockerfile`, `compose.yaml`)
* [ ] CI (GitHub Actions) for lint/test

## 🐞 Troubleshooting

* **Port in use:** change `PORT` or free 5000
* **Permission denied writing logs/JSON:** check filesystem permissions
* **Static not loading:** verify `static/` and template paths

## 🤝 Contributing

PRs are welcome! Please open an issue to discuss major changes.

## 📜 License

MIT (or your preferred license). Add a `LICENSE` file.
