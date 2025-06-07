# Kubera Backend

Personal Budgeting Web Application Backend built with FastAPI.

## Features

- **Authentication & Authorization**: User registration, login, and JWT-based authentication
- **Budget Management**: Create, update, and track budgets
- **Transaction Management**: Record and categorize financial transactions
- **Category System**: Organize expenses and income into categories
- **RESTful API**: Clean and well-documented API endpoints
- **Database**: SQLAlchemy ORM with SQLite (development) and PostgreSQL (production)

## Quick Start

### Prerequisites

- Python 3.9+
- uv (recommended) or pip

### Development Setup

1. Run the setup script:
   ```bash
   bash setup-dev.sh
   ```

2. Start the development server:
   ```bash
   uv run uvicorn app.main:app --reload
   ```

3. Access the API documentation at: http://localhost:8000/docs

### Available Commands

- `uv run uvicorn app.main:app --reload` - Start development server
- `uv run pytest` - Run tests
- `uv run black .` - Format code
- `uv run flake8 .` - Lint code  
- `uv run mypy app` - Type checking

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
app/
├── api/            # API routes and endpoints
├── core/           # Core functionality, config, security
├── models/         # Database models
├── schemas/        # Pydantic schemas
└── services/       # Business logic layer
```

## Contributing

1. Follow the code style guidelines (Black formatting)
2. Add tests for new features
3. Update documentation as needed
4. Run linting and type checking before submitting

## License

MIT License 