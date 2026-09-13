# S1NDZE SHOP

Streetwear fashion e-commerce — **Wear Your Style**.

Full-stack portfolio shop with Django REST + React, JWT auth, buyer/seller roles, cart, checkout, coupons, reviews, notifications, i18n (UZ/RU/EN), and dark mode.

Brand accent comes from the S1NDZE graffiti logo (black / white / magenta `#E91E8C`).

## Stack

**Backend:** Python, Django, DRF, SimpleJWT, django-filter, Pillow, CORS, drf-spectacular, Celery, Redis, PostgreSQL (SQLite for local)

**Frontend:** React, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, TanStack Query, Zustand, React Hook Form, Zod, i18next, Lucide, Sonner

## Features

- Auth: register / login / refresh / logout / profile (JWT + blacklist)
- Roles: buyer, seller, admin (enforced on backend)
- Catalog: categories, variants (size/color/stock), search & filters
- Cart & favorites
- Checkout with backend price/stock validation
- Payments abstraction: cash, Click, Payme, Uzcard, Humo (COD ready; gateways pluggable)
- Orders + visual status tracking
- Reviews only after delivered purchase
- Coupons (`S1NDZE10`)
- Notifications bell
- Seller dashboard (stats, CRUD products, orders)
- UZ / RU / EN + light/dark theme
- Recently viewed (localStorage)
- API docs at `/api/docs/`

### Own extras

- Magenta Drop editorial section on the homepage
- Generated streetwear product mockups + official logo tee from `s1ndze.jpg`
- Free delivery threshold (500 000 UZS)
- Size guide modal on product pages

## Quick start (local, no Docker)

### 1. Backend

```bash
cd s1ndze_shoop
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r backend/requirements.txt
copy .env.example .env   # or use the provided .env

cd backend
python manage.py migrate
python manage.py seed_shop
python manage.py runserver
```

API: http://127.0.0.1:8000  
Docs: http://127.0.0.1:8000/api/docs/  
Admin: http://127.0.0.1:8000/admin/

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Demo accounts (after seed)

| User    | Password     | Role   |
|---------|--------------|--------|
| admin   | admin12345   | admin  |
| s1ndze  | seller12345  | seller |
| buyer   | buyer12345   | buyer  |

Coupon: `S1NDZE10` (10%)

## Docker

```bash
docker compose up --build
```

Uses PostgreSQL + Redis. Set `DB_ENGINE=postgresql` (compose already does).

## Environment

See `.env.example`:

- `SECRET_KEY`, `DEBUG`
- `DB_ENGINE` = `sqlite` (default) or `postgresql`
- `DB_*`, `FRONTEND_URL`, Redis/Celery URLs
- Frontend: `VITE_API_URL=http://127.0.0.1:8000/api`

## Tests

```bash
cd backend
python manage.py test common
```

## Project layout

```
s1ndze_shoop/
├── backend/          # Django apps: users, products, cart, orders, ...
├── frontend/         # React + Vite
├── docker-compose.yml
├── .env.example
├── s1ndze.jpg        # Brand logo
└── README.md
```

## Notes

- Prices and stock are always calculated on the backend — never trust the client.
- Celery runs in eager mode locally so the app works without Redis.
- Media files are stored under `backend/media/`.
