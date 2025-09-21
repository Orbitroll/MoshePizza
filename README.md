# MoshePizza

Flask application for ordering pizzas, managing dine-in tables, and generating/sending invoices. It ships with a modern UI (Jinja2 templates + static assets), admin utilities, and a SQLite database for recorded invoices.

Status: Work-in-progress. This README reflects the current working codepaths and how to run them locally.

---

## Features

- Flask app entry `main.py` with blueprints: `admins`, `users`, `tables_system`, `invoices_system`.
- Order flow with UI pages: `/home/`, `/menu/`, `/about/`, `/order/`.
- Waiters dashboard UI page: `/tables/waiters/` (live status + clear tables).
- Order API: persists the last order to `jsons/order.json` and copies to `orders/order_<id>.json`.
- Invoice persistence: saves computed invoice rows to SQLite (`DataBase/invoice.db`).
- Invoice generation: builds Markdown + PDF via Pandoc and emails the PDF using Gmail (yagmail).
- Tables management: allocate/clear tables for dine-in and track waiter load with JSON state.
- Admin tools: weather-aware dough recipe and pizza build flow.
- Logging: append-only file `orders.log` plus debug endpoints for DB stats.

---

## Project Structure (high level)
```
MoshePizza/
  admins/                # Admin endpoints (blueprint)
  DataBase/              # SQLAlchemy setup + SQLite DB file
  invoices/              # Generated invoices (.md/.pdf)
  invoices_system/       # Invoice blueprint + email/Pandoc logic
  jsons/                 # App JSON data (e.g., last order)
  loggs/                 # Simple logger helper
  orders/                # Saved orders as JSON files
  static/                # CSS/JS/assets for the UI
  tables_system/         # Tables blueprint + table class + JSON state
  templates/             # Jinja2 HTML pages
  used_tables/           # Saved occupied table files
  users/                 # User blueprint
  main.py                # Flask app entrypoint
  classes.py             # Weather + Pizza + Order helpers
  pizza_types.py         # Pizza type classes
  prices.py              # Prices for toppings/drinks
  requirements.txt       # Python dependencies
```

---

## Quick Start

### Requirements
- Python 3.10+
- Install Python deps: `pip install -r requirements.txt`
- For invoice PDF generation: install Pandoc and a LaTeX engine (e.g., MiKTeX on Windows, TeX Live on Linux/macOS)

Notes
- Email sending uses Gmail via `yagmail`. Use an app password and avoid committing secrets. See “Email setup” below.
- SQLite DB is created automatically at `DataBase/invoice.db` on first run.

### Setup
```
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### Run
Option A — Flask CLI
```
# PowerShell
$env:FLASK_APP = "main.py"
$env:FLASK_ENV = "development"
flask run

# bash
export FLASK_APP=main.py
export FLASK_ENV=development
flask run
```

Option B — Python
```
python main.py
```

The app listens on `http://127.0.0.1:5000` by default.

---

## Key Endpoints

- Pages
  - `GET /home/`, `GET /menu/`, `GET /about/`, `GET /order/`
  - `GET /tables/waiters/` — Waiters dashboard UI

- Orders
  - `POST /order/place-order` — Accepts JSON from the Order UI, writes to `jsons/order.json` and `orders/order_<id>.json`, logs to `orders.log`, and creates an `Invoice` DB row with computed totals.
  - `GET /order/<id>` — Return an order JSON from `orders/order_<id>.json`.
  - `GET /order/pizza` — Return the last order (simple debug helper).
  - `GET /order/pizza/all-pizzas` — Return all collected orders for the process lifetime.

- Invoices
  - `GET /invoices/db` — Return latest 20 invoice rows from SQLite (id, totals, timestamps).
  - `POST /invoices/new-md/` — Build Markdown invoice and convert to PDF (Pandoc), then email it to the order’s email address via Gmail.

- Tables (dine-in)
  - `POST /tables/new-table/` — Allocate a table for the last order if `order_type == "dine-in"`; assigns a waiter, persists JSON under `used_tables/`.
  - `GET /tables/free-tables` — List currently free table numbers.
  - `GET /tables/table-<num>` — Return table JSON details for a specific table.
  - `DELETE /tables/delete-table/<num>` — Clear a table and free the waiter.
  - UI: `GET /tables/waiters/` — Dashboard to monitor and clear tables.

- Admin
  - `GET /admin/Kitchen_bon` — Weather-aware dough recipe suggestion.
  - `POST /admin/order/pizza/` — Build pizzas from the last order and then redirect to invoice generation.

- Debug
  - `GET /debug/db-info` — Basic DB URL and invoice count
  - `GET /debug/counts` — Invoice count only

---

## Email Setup (invoices)

- The current code uses Gmail + `yagmail` and imports an app password from `invoices_system/app_pass.py` as `secret`.
- Recommended for local dev only: create `invoices_system/app_pass.py` with:
  ```python
  secret = "<your-gmail-app-password>"
  ```
- For production, load secrets from environment variables and do not commit them.
- The sender address is currently hard-coded in `invoices_system/dynamic_invoices.py` (`pizzamosheyavne@gmail.com`). Update to your address if needed.

---

## PDF Generation (Pandoc)

- Install Pandoc (https://pandoc.org/installing.html).
- Install a LaTeX engine to enable PDF output (e.g., MiKTeX on Windows, TeX Live on Linux/macOS).
- `pypandoc` will call the Pandoc binary to convert the Markdown invoice to PDF.

---

## Data & Persistence

- Orders
  - Last order: `jsons/order.json`
  - Historical orders: `orders/order_<id>.json`

- Invoices (DB)
  - SQLite file: `DataBase/invoice.db`
  - Model: `Invoice(id, external_order_id, customer, subtotal, tip, total, created_at, json)`

- Tables state (JSON)
  - `tables_system/jsons/tables_taken.json` — taken table numbers
  - `tables_system/jsons/table_instances.json` — count of active tables
  - `tables_system/jsons/tables_waiters.json` — waiter -> assigned table count

---

## Development Notes

- Blueprints are registered in `main.py`.
- Static assets (`static/`) and templates (`templates/`) back the UI pages, including a dynamic order builder (`static/order.js`).
- To reset invoices DB for a clean slate, stop the server and delete `DataBase/invoice.db` (the app recreates tables on start).
- Avoid committing secrets (e.g., email passwords). Prefer environment variables or a local, untracked config file.

---

## Troubleshooting

- “pandoc not found” or PDF generation fails
  - Install Pandoc and a LaTeX engine; confirm `pandoc --version` works in your shell.

- Email fails
  - Ensure Gmail app password is set, and the sender address is correct in `invoices_system/dynamic_invoices.py`.

- DB errors on first run
  - Ensure your virtual environment is active and `Flask-SQLAlchemy` is installed via `pip install -r requirements.txt`.

---

## License

No explicit license provided. Treat as private/internal unless a license is added.

