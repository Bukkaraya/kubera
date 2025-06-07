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
│   ├── pyproject.toml
│   ├── setup-dev.sh
│   ├── setup-dev.bat
│   └── ...
├── frontend/          # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip
- Node.js 16+
- PostgreSQL (optional, SQLite used by default)

## Development Setup

### Backend Setup

#### Using uv (Recommended)

1. Install uv if you haven't already:
   ```bash
   # On macOS and Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # On Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   
   # Or with pip
   pip install uv
   ```

2. Navigate to the backend directory and run setup:
   ```bash
   cd backend
   
   # On Unix/macOS
   chmod +x setup-dev.sh && ./setup-dev.sh
   
   # On Windows
   setup-dev.bat
   ```

3. Start the development server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```

#### Using pip (Alternative)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
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