#!/usr/bin/env python3
"""
Create sample budgets for testing
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get JWT token for authentication"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Authentication successful")
            return token
        else:
            print(f"❌ Authentication failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def get_categories(token):
    """Get existing categories"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/categories", headers=headers)
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Found {len(categories)} existing categories")
            return categories
        else:
            print(f"❌ Failed to get categories: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error getting categories: {e}")
        return []

def create_category_if_not_exists(token, name, description=""):
    """Create a category if it doesn't exist"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # First check if category exists
    categories = get_categories(token)
    existing = next((c for c in categories if name.lower() in c['name'].lower()), None)
    if existing:
        print(f"✅ Category '{name}' already exists (ID: {existing['id']})")
        return existing
    
    # Create new category
    category_data = {"name": name, "description": description}
    try:
        response = requests.post(f"{BASE_URL}/api/categories", json=category_data, headers=headers)
        if response.status_code in [200, 201]:
            category = response.json()
            print(f"✅ Created category: {category['name']} (ID: {category['id']})")
            return category
        else:
            print(f"❌ Failed to create category {name}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating category {name}: {e}")
        return None

def create_budgets(token):
    """Create sample budgets"""
    headers = {"Authorization": f"Bearer {token}"}
    now = datetime.now()
    
    # Define categories and budgets
    budget_data = [
        {"category_name": "Food & Dining", "budget_name": "Monthly Food Budget", "amount": 600.00, "description": "Groceries, restaurants, and food delivery"},
        {"category_name": "Transportation", "budget_name": "Transportation Budget", "amount": 300.00, "description": "Gas, public transit, ride-sharing"},
        {"category_name": "Entertainment", "budget_name": "Entertainment Budget", "amount": 200.00, "description": "Movies, streaming services, events"},
        {"category_name": "Shopping", "budget_name": "Shopping Budget", "amount": 400.00, "description": "Clothing, electronics, household items"},
        {"category_name": "Utilities", "budget_name": "Monthly Utilities", "amount": 350.00, "description": "Electricity, water, internet, phone"},
        {"category_name": "Healthcare", "budget_name": "Healthcare Budget", "amount": 250.00, "description": "Medical expenses, insurance, pharmacy"},
        {"category_name": "Housing", "budget_name": "Housing Expenses", "amount": 1500.00, "description": "Rent, maintenance, home improvements"},
    ]
    
    created_budgets = []
    
    for item in budget_data:
        # Create or get category
        category = create_category_if_not_exists(token, item["category_name"], item["description"])
        if not category:
            continue
        
        budget_request = {
            "name": item["budget_name"],
            "amount": item["amount"],
            "period_year": now.year,
            "period_month": now.month,
            "category_id": category['id']
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/budgets", json=budget_request, headers=headers)
            if response.status_code in [200, 201]:
                budget = response.json()
                created_budgets.append(budget)
                print(f"✅ Created budget: {budget['name']} - ${budget['amount']} for {category['name']}")
            else:
                print(f"❌ Failed to create budget {item['budget_name']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating budget {item['budget_name']}: {e}")
    
    return created_budgets

def main():
    print("🚀 Creating sample budgets for Kubera...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return
    
    print("\n📊 Creating budgets...")
    budgets = create_budgets(token)
    
    print(f"\n🎉 Budget creation complete!")
    print(f"   Created: {len(budgets)} budgets")
    print(f"   Total Budget Allocated: ${sum(b['amount'] for b in budgets):.2f}")
    
    # Trigger spent amount calculation
    print("\n🔄 Refreshing budget spent amounts...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(f"{BASE_URL}/api/budgets/refresh-spent-amounts", headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Updated {result['count']} budget spent amounts")
        else:
            print(f"❌ Failed to refresh spent amounts: {response.status_code}")
    except Exception as e:
        print(f"❌ Error refreshing spent amounts: {e}")

if __name__ == "__main__":
    main() 