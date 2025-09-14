# MoshePizza

A lightweight Flask-based app for managing pizza recipes, orders, and basic user/admin flows. The project includes blueprints for admin utilities, HTML templates for the UI, and Python classes for dough/recipe logic.

> Status: Work-in-progress (WIP). This README documents the current layout and provides quick-start steps to run and hack on the project locally.

---

## ✨ Features (current state)

- **Flask App Entry Point** – `main.py` boots the server and wires routes.
- **Recipe & Dough Logic** – `Pizza_Classes.py`, `pizza_types.py`, and helpers in `utils.py` / `data.py` hold domain logic.
- **Admin Utilities** – `admins/` for admin endpoints/utilities.
- **User Module** – `users/` for user-related code and flows.
- **Rendering/UI** – Jinja2 templates in `templates/` and assets in `static/` + `assets/`.
- **System Modules** – `invoices_system/`, `tables_system/` (domain-specific features).
- **Logging** – `loggs/` and `orders.log` for runtime traces.
- **Samples/JSON** – `jsons/` and docs like `pizza moshe menu.md`, `average pizza order.txt`.

> Repo folders & files observed: `admins/`, `assets/`, `bot/`, `invoices_system/`, `jsons/`, `loggs/`, `static/`, `tables_system/`, `templates/`, `users/`, `.gitignore`, `Pizza_Classes.py`, `Untitled Diagram.drawio`, `average pizza order.txt`, `classes.py`, `clock.py`, `data.py`, `main.py`, `orders.log`, `pizza moshe menu.md`, `pizza_types.py`, `pizzamoshe.drawio`, `utils.py`. :contentReference[oaicite:1]{index=1}

---

## 🧱 Project Structure
```
MoshePizza/
├─ admins/ # Admin blueprints/utilities
├─ assets/ # Images/fonts/etc.
├─ bot/ # (If used) Bot helpers/scripts
├─ invoices_system/ # Invoicing domain module
├─ jsons/ # JSON fixtures / data files
├─ loggs/ # Log directory
├─ static/ # CSS/JS/static assets
├─ tables_system/ # Tables domain module
├─ templates/ # Jinja2 HTML templates
├─ users/ # User management module
├─ Pizza_Classes.py # Pizza/Dough recipe classes
├─ classes.py # Additional shared classes
├─ clock.py # Time/clock helper(s)
├─ data.py # Data access/helpers
├─ main.py # Flask app entry point
├─ pizza_types.py # Pizza types/enums/data
├─ utils.py # Utilities
└─ ... (drawio diagrams, logs, docs)
```


---

## 🚀 Quick Start

### Requirements
- **Python 3.10+** (3.11/3.12 also fine)  
- Flask, Jinja2 (install via pip)  

### Setup

```bash
# Clone
git clone https://github.com/Orbitroll/MoshePizza.git
cd MoshePizza

# Virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install deps
# If requirements.txt exists:
pip install -r requirements.txt

# If not, start with:
pip install flask Jinja2
```


### Run 
```
# Option A: Flask CLI
export FLASK_APP=main.py        # Windows: $env:FLASK_APP="main.py"
export FLASK_ENV=development
flask run

# Option B: Python directly
python main.py
```

🧪 Development Tips
```
Keep routes modular with blueprints (admins/, users/).
Templates → templates/; CSS/JS/images → static/.
Logging → configure Python logging into loggs/ and orders.log.
Avoid circular imports: consider the Flask app factory (create_app) pattern.
```

