#!/usr/bin/env python3
"""
Script to create test data for Kubera backend
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin123"

def get_token():
    """Get JWT token for API calls"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": USERNAME, "password": PASSWORD}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def create_categories(token):
    """Create test categories or get existing ones"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # First, get existing categories
    try:
        response = requests.get(f"{BASE_URL}/api/categories/", headers=headers)
        if response.status_code == 200:
            existing_categories = response.json()
            print(f"✅ Found {len(existing_categories)} existing categories")
            return existing_categories
        else:
            print(f"❌ Failed to get existing categories: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting existing categories: {e}")
    
    # If no existing categories, create new ones
    categories = [
        {"name": "Food & Dining", "description": "Restaurants, groceries, and food expenses"},
        {"name": "Transportation", "description": "Gas, public transit, car maintenance"}, 
        {"name": "Housing", "description": "Rent, utilities, home maintenance"},
        {"name": "Entertainment", "description": "Movies, games, subscriptions"},
        {"name": "Salary", "description": "Monthly salary and bonuses"},
        {"name": "Shopping", "description": "Clothing, electronics, misc purchases"}
    ]
    
    created_categories = []
    
    for category_data in categories:
        try:
            response = requests.post(
                f"{BASE_URL}/api/categories/",
                json=category_data,
                headers=headers
            )
            if response.status_code in [200, 201]:
                category = response.json()
                created_categories.append(category)
                print(f"✅ Created category: {category['name']} (ID: {category['id']})")
            else:
                print(f"❌ Failed to create category {category_data['name']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating category {category_data['name']}: {e}")
    
    return created_categories

def create_accounts(token):
    """Create test accounts"""
    accounts = [
        {"name": "Chase Checking", "account_type": "checking", "initial_balance": 2500.00, "description": "Main checking account"},
        {"name": "Savings Account", "account_type": "savings", "initial_balance": 15000.00, "description": "Emergency fund savings"},
        {"name": "Credit Card", "account_type": "credit_card", "initial_balance": 0.00, "description": "Chase Freedom credit card"}
    ]
    
    created_accounts = []
    headers = {"Authorization": f"Bearer {token}"}
    
    for account_data in accounts:
        try:
            response = requests.post(
                f"{BASE_URL}/api/accounts/",
                json=account_data,
                headers=headers
            )
            if response.status_code in [200, 201]:
                account = response.json()
                created_accounts.append(account)
                print(f"✅ Created account: {account['name']} (ID: {account['id']})")
            else:
                print(f"❌ Failed to create account {account_data['name']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating account {account_data['name']}: {e}")
    
    return created_accounts

def create_transactions(token, accounts, categories):
    """Create test transactions"""
    if not accounts or not categories:
        print("❌ Cannot create transactions without accounts and categories")
        return []
    
    # Find specific categories and accounts
    checking_account = next((a for a in accounts if "checking" in a['name'].lower()), accounts[0])
    food_category = next((c for c in categories if "food" in c['name'].lower()), categories[0])
    transport_category = next((c for c in categories if "transport" in c['name'].lower()), categories[1])
    salary_category = next((c for c in categories if "salary" in c['name'].lower()), categories[-1])
    
    transactions = [
        {
            "amount": 3500.00,
            "description": "Monthly Salary",
            "transaction_date": datetime.now().isoformat(),
            "is_income": True,
            "account_id": checking_account['id'],
            "category_id": salary_category['id'],
            "notes": "December salary payment"
        },
        {
            "amount": -45.67,
            "description": "Grocery Store",
            "transaction_date": (datetime.now() - timedelta(days=1)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": food_category['id'],
            "notes": "Weekly grocery shopping"
        },
        {
            "amount": -32.50,
            "description": "Gas Station",
            "transaction_date": (datetime.now() - timedelta(days=2)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": transport_category['id'],
            "notes": "Fill up gas tank"
        }
    ]
    
    created_transactions = []
    headers = {"Authorization": f"Bearer {token}"}
    
    for transaction_data in transactions:
        try:
            response = requests.post(
                f"{BASE_URL}/api/transactions/",
                json=transaction_data,
                headers=headers
            )
            if response.status_code in [200, 201]:
                transaction = response.json()
                created_transactions.append(transaction)
                print(f"✅ Created transaction: {transaction['description']} (${transaction['amount']})")
            else:
                print(f"❌ Failed to create transaction {transaction_data['description']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating transaction {transaction_data['description']}: {e}")
    
    return created_transactions

def create_budget(token, categories):
    """Create a test budget"""
    if not categories:
        print("❌ Cannot create budget without categories")
        return None
    
    food_category = next((c for c in categories if "food" in c['name'].lower()), categories[0])
    now = datetime.now()
    
    budget_data = {
        "name": "Monthly Food Budget",
        "amount": 400.00,
        "period_year": now.year,
        "period_month": now.month,
        "category_id": food_category['id']
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/budgets/",
            json=budget_data,
            headers=headers
        )
        if response.status_code in [200, 201]:
            budget = response.json()
            print(f"✅ Created budget: {budget['name']} (${budget['amount']})")
            return budget
        else:
            print(f"❌ Failed to create budget: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error creating budget: {e}")
    
    return None

def main():
    print("🚀 Creating test data for Kubera backend...")
    
    # Get authentication token
    token = get_token()
    if not token:
        return
    
    print(f"✅ Authentication successful")
    
    # Create categories
    print("\n📁 Creating categories...")
    categories = create_categories(token)
    
    # Create accounts  
    print("\n💳 Creating accounts...")
    accounts = create_accounts(token)
    
    # Create transactions
    print("\n💰 Creating transactions...")
    transactions = create_transactions(token, accounts, categories)
    
    # Create budget
    print("\n📊 Creating budget...")
    budget = create_budget(token, categories)
    
    print(f"\n🎉 Test data creation complete!")
    print(f"   Categories: {len(categories)}")
    print(f"   Accounts: {len(accounts)}")
    print(f"   Transactions: {len(transactions)}")
    print(f"   Budgets: {1 if budget else 0}")

if __name__ == "__main__":
    main() 