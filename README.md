# BookHub

BookHub is a full-stack online library built with Django REST Framework and React. Users can browse books, save favorites, read full texts in a custom reader mode, publish reviews, manage their profile, and restore account access through a password reset flow.

## Stack

- Backend: Django, Django REST Framework, Simple JWT, WhiteNoise
- Frontend: React, Vite, React Router, Axios
- Database: SQLite for local development, PostgreSQL for deployment
- Deployment: Docker + Render blueprint

## Features

- registration and login with JWT authentication
- catalog with search, genre filters, rating filters, and favorites
- book page with average rating and user reviews
- reader mode with theme switcher, font settings, and saved reading progress
- profile editing with optional password change
- password reset request and confirmation flow
- Django admin for books, reviews, and favorites
- single-service production deployment where Django serves the built React app

## Project Structure

- `backend/` - Django settings, routing, and deployment-facing views
- `library/` - models, API, serializers, admin, and tests
- `my-react-app/` - React frontend
- `media/` - uploaded book covers
- `render.yaml` - Render blueprint
- `Dockerfile` - production image for the full app

## Requirements

- Python 3.10+
- Node.js 20+ for local frontend development and builds

## Local Setup

1. Create and activate a virtual environment.
2. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env`.
4. Install frontend dependencies:

   ```bash
   cd my-react-app
   npm install
   ```

5. Copy `my-react-app/.env.example` to `my-react-app/.env`.

## Local Run

Backend:

```bash
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd my-react-app
npm run dev
```

Open:

- frontend: `http://127.0.0.1:5173`
- backend/API: `http://127.0.0.1:8000`

## Useful Commands

```bash
python manage.py check
python manage.py test
cd my-react-app && npm run build
python manage.py collectstatic --noinput
```

## Deployment on Render

The project is prepared for a single public URL: Django serves the API, admin panel, media, and the built React frontend from one Render web service.

### Fastest option

1. Push the project to GitHub.
2. In Render, choose **New + > Blueprint**.
3. Select the repository.
4. Render will read `render.yaml` and create:
   - one Docker web service
   - one PostgreSQL database
5. Wait for the first deploy to finish.

The service is configured with:

- `render.yaml` for the infrastructure definition
- `Dockerfile` for building the full Django + React app
- `/health/` as a health check endpoint
- `preDeployCommand` for migrations

## Notes for Demo

- In production, the app is meant to be opened from one link.
- Password reset emails use the configured backend. Locally they are printed to the Django console by default.
- If you want admin-uploaded media to persist long-term in production, the next step would be moving media storage to an external service such as S3-compatible storage.

## Verification

- `python manage.py check`
- `python manage.py test`
- `npm run build`
