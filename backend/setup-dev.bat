@echo off
REM Kubera Backend Development Setup Script for Windows
REM This script sets up the development environment using uv

echo 🚀 Setting up Kubera Backend Development Environment
echo ==================================================

REM Check if uv is installed
uv --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ uv is not installed. Please install it first:
    echo    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    echo    or
    echo    pip install uv
    pause
    exit /b 1
)

echo ✅ uv found
uv --version

REM Create virtual environment and install dependencies
echo 📦 Installing dependencies...
uv sync --dev

echo.
echo 📋 Available commands:
echo   uv run uvicorn app.main:app --reload    # Start development server
echo   uv run pytest                          # Run tests
echo   uv run black .                         # Format code
echo   uv run flake8 .                       # Lint code
echo   uv run mypy app                       # Type checking

echo.
echo 🎉 Development environment setup complete!
echo 💡 To activate the virtual environment manually: .venv\Scripts\activate
echo 🏃 To start the server: uv run uvicorn app.main:app --reload

pause 