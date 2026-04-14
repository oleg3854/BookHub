install:
	pip install --break-system-packages -r requirements.txt
	cd my-react-app && npm install

run:
	python manage.py runserver & cd my-react-app && npm run dev