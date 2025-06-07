# Kubera - Personal Budgeting Web Application

A comprehensive personal budgeting web application built with React frontend and FastAPI backend.

## Features

- Secure user authentication
- Account management (Checking, Savings, Investment)
- Transaction tracking and categorization
- Recurring transaction automation
- Budget management and monitoring
- Data visualization and reporting
- Import/Export functionality
- Responsive web interface

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy + PostgreSQL/SQLite
- JWT Authentication
- Alembic for migrations

### Frontend
- React with Vite
- React Router
- Axios for API calls
- Chart.js for visualizations
- Tailwind CSS for styling

## Project Structure

```
kubera/
├── backend/           # FastAPI backend
│   ├── app/
│   ├── alembic/
│   ├── requirements.txt
│   └── ...
├── frontend/          # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── README.md
```

## Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Database Setup

The application uses SQLAlchemy with automatic migrations via Alembic. Run:

```bash
cd backend
alembic upgrade head
```

## Environment Variables

Create a `.env` file in the backend directory:

```
DATABASE_URL=sqlite:///./kubera.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Development Timeline

This project follows a phased development approach as outlined in `plan.md`.

## License

MIT License