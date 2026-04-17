install-backend:
	pip install --break-system-packages -r requirements.txt

install-frontend:
	cd my-react-app && npm install

install: install-backend install-frontend

build-frontend:
	cd my-react-app && npm run build

run-backend:
	python manage.py runserver

run-frontend:
	cd my-react-app && npm run dev

check:
	python manage.py check

test:
	python manage.py test

collectstatic:
	python manage.py collectstatic --noinput
