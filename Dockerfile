FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/my-react-app
COPY my-react-app/package*.json ./
RUN npm ci
COPY my-react-app/ ./
RUN npm run build


FROM python:3.12-slim AS app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend-build /app/my-react-app/dist /app/my-react-app/dist

RUN python manage.py collectstatic --noinput

CMD ["sh", "-c", "gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers 3"]
