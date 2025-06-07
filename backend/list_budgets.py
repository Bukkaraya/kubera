#!/usr/bin/env python3
"""
List all current budgets
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get JWT token for authentication"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.json()["access_token"]

def list_budgets():
    """List all budgets"""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/budgets", headers=headers)
    budgets = response.json()
    
    print(f"📊 Current Budgets ({len(budgets)} total):")
    print("=" * 80)
    
    for budget in budgets:
        print(f"💰 {budget['name']}")
        print(f"   Category: {budget['category']['name'] if budget.get('category') else 'Unknown'}")
        print(f"   Amount: ${budget['amount']:.2f}")
        print(f"   Spent: ${budget['spent_amount']:.2f}")
        print(f"   Remaining: ${budget['remaining_amount']:.2f}")
        print(f"   Progress: {budget['percentage_used']:.1f}%")
        print(f"   Period: {budget['period_year']}-{budget['period_month']:02d}")
        print()
    
    total_budgeted = sum(b['amount'] for b in budgets)
    total_spent = sum(b['spent_amount'] for b in budgets)
    
    print("=" * 80)
    print(f"📈 Summary:")
    print(f"   Total Budgeted: ${total_budgeted:.2f}")
    print(f"   Total Spent: ${total_spent:.2f}")
    print(f"   Total Remaining: ${total_budgeted - total_spent:.2f}")

if __name__ == "__main__":
    list_budgets() 