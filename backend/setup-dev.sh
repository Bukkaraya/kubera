#!/bin/bash

# Kubera Backend Development Setup Script
# This script sets up the development environment using uv

set -e

echo "🚀 Setting up Kubera Backend Development Environment"
echo "=================================================="

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install it first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo "   or"
    echo "   pip install uv"
    exit 1
fi

echo "✅ uv found: $(uv --version)"

# Create virtual environment and install dependencies
echo "📦 Installing dependencies..."
uv sync --dev

echo "📋 Available commands:"
echo "  uv run uvicorn app.main:app --reload    # Start development server"
echo "  uv run pytest                          # Run tests"
echo "  uv run black .                         # Format code"
echo "  uv run flake8 .                       # Lint code"
echo "  uv run mypy app                       # Type checking"

echo ""
echo "🎉 Development environment setup complete!"
echo "💡 To activate the virtual environment manually: source .venv/bin/activate"
echo "🏃 To start the server: uv run uvicorn app.main:app --reload" 