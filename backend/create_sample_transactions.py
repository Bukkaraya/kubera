#!/usr/bin/env python3
"""
Create sample transactions to make budget tracking more realistic
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get JWT token for authentication"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.json()["access_token"]

def get_accounts_and_categories(token):
    """Get accounts and categories"""
    headers = {"Authorization": f"Bearer {token}"}
    
    accounts_response = requests.get(f"{BASE_URL}/api/accounts", headers=headers)
    categories_response = requests.get(f"{BASE_URL}/api/categories", headers=headers)
    
    return accounts_response.json(), categories_response.json()

def create_sample_transactions():
    """Create realistic sample transactions"""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    accounts, categories = get_accounts_and_categories(token)
    
    # Find specific accounts
    checking_account = next((a for a in accounts if "checking" in a['name'].lower()), accounts[0])
    credit_account = next((a for a in accounts if "credit" in a['name'].lower()), accounts[-1])
    
    # Find categories
    cat_map = {cat['name']: cat['id'] for cat in categories}
    
    now = datetime.now()
    
    # Sample transactions that will show up in budget tracking
    transactions = [
        # Food & Dining expenses
        {
            "amount": -45.30,
            "description": "Starbucks Coffee",
            "transaction_date": (now - timedelta(days=1)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Food & Dining"),
            "notes": "Morning coffee"
        },
        {
            "amount": -89.50,
            "description": "Whole Foods Market",
            "transaction_date": (now - timedelta(days=2)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Food & Dining"),
            "notes": "Weekly grocery shopping"
        },
        {
            "amount": -32.75,
            "description": "Thai Restaurant",
            "transaction_date": (now - timedelta(days=3)).isoformat(),
            "is_income": False,
            "account_id": credit_account['id'],
            "category_id": cat_map.get("Food & Dining"),
            "notes": "Dinner with friends"
        },
        
        # Transportation expenses
        {
            "amount": -55.00,
            "description": "Shell Gas Station",
            "transaction_date": (now - timedelta(days=2)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Transportation"),
            "notes": "Fill up gas tank"
        },
        {
            "amount": -25.00,
            "description": "Uber Ride",
            "transaction_date": (now - timedelta(days=4)).isoformat(),
            "is_income": False,
            "account_id": credit_account['id'],
            "category_id": cat_map.get("Transportation"),
            "notes": "Ride to airport"
        },
        
        # Entertainment expenses
        {
            "amount": -15.99,
            "description": "Netflix Subscription",
            "transaction_date": (now - timedelta(days=5)).isoformat(),
            "is_income": False,
            "account_id": credit_account['id'],
            "category_id": cat_map.get("Entertainment"),
            "notes": "Monthly subscription"
        },
        {
            "amount": -28.50,
            "description": "Movie Theater",
            "transaction_date": (now - timedelta(days=6)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Entertainment"),
            "notes": "Movie night"
        },
        
        # Shopping expenses
        {
            "amount": -89.99,
            "description": "Amazon Purchase",
            "transaction_date": (now - timedelta(days=3)).isoformat(),
            "is_income": False,
            "account_id": credit_account['id'],
            "category_id": cat_map.get("Shopping"),
            "notes": "Electronics and books"
        },
        {
            "amount": -125.00,
            "description": "Target Store",
            "transaction_date": (now - timedelta(days=7)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Shopping"),
            "notes": "Clothing and household items"
        },
        
        # Utilities expenses
        {
            "amount": -95.50,
            "description": "Electric Company",
            "transaction_date": (now - timedelta(days=8)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Utilities"),
            "notes": "Monthly electricity bill"
        },
        {
            "amount": -65.00,
            "description": "Internet Service Provider",
            "transaction_date": (now - timedelta(days=9)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Utilities"),
            "notes": "Monthly internet bill"
        },
        
        # Healthcare expenses
        {
            "amount": -75.00,
            "description": "CVS Pharmacy",
            "transaction_date": (now - timedelta(days=5)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Healthcare"),
            "notes": "Prescription medication"
        },
        {
            "amount": -45.00,
            "description": "Doctor Visit Copay",
            "transaction_date": (now - timedelta(days=10)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": cat_map.get("Healthcare"),
            "notes": "Routine checkup"
        },
    ]
    
    created_count = 0
    
    for transaction_data in transactions:
        if not transaction_data['category_id']:
            continue
            
        try:
            response = requests.post(
                f"{BASE_URL}/api/transactions",
                json=transaction_data,
                headers=headers
            )
            if response.status_code in [200, 201]:
                transaction = response.json()
                created_count += 1
                print(f"✅ Created transaction: {transaction['description']} (${abs(transaction['amount']):.2f})")
            else:
                print(f"❌ Failed to create transaction {transaction_data['description']}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error creating transaction {transaction_data['description']}: {e}")
    
    return created_count

def main():
    print("🚀 Creating sample transactions for budget tracking...")
    
    created = create_sample_transactions()
    
    print(f"\n✅ Created {created} sample transactions")
    
    # Refresh budget spent amounts
    print("\n🔄 Refreshing budget spent amounts...")
    token = get_auth_token()
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