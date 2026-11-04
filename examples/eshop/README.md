# E-shop — a runnable Habarico example

A small admin for an e-shop (`Product`, `Category`, `Order`, `Customer`), the domain the
documentation uses throughout. It exists twice on the backend and once on the frontend:

| Directory | What it is |
|---|---|
| `django/` | Django + DRF backend, `habarico` from `../../python` |
| `rails/` | Rails backend, `habarico` from `../../ruby` |
| `frontend/` | React admin, `habarico` from `../../node` — one build, either backend |

Everything it needs is public: `habarico` and `eluvia-base` are on rubygems.org and PyPI, so no
token and no private registry are involved. The libraries are taken straight from this working
tree, which is the point — a change that breaks the example breaks it in the same pull request.

**Authentication is not part of Habarico.** Each backend writes its own, on standard framework
pieces: Django sessions with `django.contrib.auth`, Rails sessions with `has_secure_password`.
They answer the same handful of endpoints, so the one frontend signs in against either.

## Running it

Pick a backend and bring the whole thing up:

```bash
docker compose --profile python up -d   # Django
docker compose --profile ruby   up -d   # Rails
```

Either builds the libraries out of this working tree, migrates and seeds the backend, and serves
the admin on **http://localhost:5173** — sign in as **admin@habarico.com / admin1234**. The backend
is on `:8000` and the database on `:5432`. Tear it down with `docker compose --profile <name>
down -v`; the first build takes a few minutes, because the frontend image builds the React library
too.

The images carry a copy of the source rather than a bind mount, so nothing reloads when you edit:
compose runs the example, it does not develop it. For that, run the pieces yourself.

## Running it natively

### 1. The database

```bash
docker compose up -d db
```

Postgres, which Habarico needs for the advisory lock it takes on a record before an update or a
delete. Each backend owns a database of its own; the Rails one is created for you.

### 2. A backend

Django, on `http://localhost:8000`:

```bash
cd django
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed
.venv/bin/python manage.py runserver
```

…or Rails, on the same port:

```bash
cd rails
bundle install
bin/rails db:prepare db:seed
bin/rails server -p 8000
```

Either way the seed creates **admin@habarico.com / admin1234** and a few records to look at.

### 3. The frontend

`habarico` is linked from `../../../node`, and what npm links is that package's **build output**, so
build the library first — otherwise the admin runs against whatever `node/lib` happens to hold:

```bash
cd ../../node && npm install && npm run build

cd ../examples/eshop/frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to the backend, so the admin and the
API share one origin and the session cookie reaches both. Point it elsewhere with
`API_URL=http://localhost:9000 npm run dev`.

A forgotten-password request prints the reset e-mail, link and all, to the terminal the backend
runs in.

## The auth contract

Both backends serve these under `/api/auth/`, and the frontend's
[`buildServiceAuthProvider`](https://docs.habarico.com/node/providers/auth-provider) calls them:

| Endpoint | What it does |
|---|---|
| `POST login/` | `username` (the e-mail) + `password`, starts a session, returns the user |
| `POST logout/` | ends the session |
| `GET/PATCH current-user/` | the signed-in user and their profile |
| `POST current-user/change-password/` | `old_password` + `new_password` |
| `POST forgotten-password/` | e-mails a reset link; answers the same for an unknown address |
| `POST reset-password/` | `token` from that link + the new `password` |

A write carries the session's CSRF token in the `X-CSRFToken` header, read from the `csrftoken`
cookie. That is Django's naming; the Rails backend adopts it so the one frontend needs no branch.

Errors come back as `{"errors": [{"source": "<field>", "message": "…"}]}` with status 422, which
is what lets the admin put a message under the field it belongs to. `non_field_errors` is the
form-level source.

The admin API itself (`/api/admin/`) is staff-only: anonymous is 401, a signed-in non-staff user
is 403.

## Tests

Both backends test the contract above, and smoke-test the library serving the four resources. CI
runs them on every pull request.

```bash
cd django && .venv/bin/python manage.py test
cd rails  && bin/rails test
```

## What it is not

Development only — the secret keys are in the source, `DEBUG` is on, and e-mail goes to the
console. There is no MFA, no SSO and no registration: `login` never reports a second factor, so
the MFA functions the frontend's auth provider requires are stubs.
