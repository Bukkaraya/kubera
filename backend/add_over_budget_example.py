#!/usr/bin/env python3
"""
Add transactions to create an over-budget scenario for demonstration
"""
import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get JWT token for authentication"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.json()["access_token"]

def create_over_budget_example():
    """Create transactions that put Food budget over limit"""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get accounts and categories
    accounts_response = requests.get(f"{BASE_URL}/api/accounts", headers=headers)
    categories_response = requests.get(f"{BASE_URL}/api/categories", headers=headers)
    
    accounts = accounts_response.json()
    categories = categories_response.json()
    
    # Find checking account and food category
    checking_account = next((a for a in accounts if "checking" in a['name'].lower()), accounts[0])
    food_category = next((c for c in categories if "food" in c['name'].lower()), categories[0])
    
    now = datetime.now()
    
    # Add some more food expenses to push it over budget
    # Food budget is currently at $353.05 out of $400, so we need about $50+ more
    over_budget_transactions = [
        {
            "amount": -85.00,
            "description": "Expensive Restaurant",
            "transaction_date": (now - timedelta(hours=2)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": food_category['id'],
            "notes": "Business dinner - went over budget!"
        }
    ]
    
    for transaction_data in over_budget_transactions:
        try:
            response = requests.post(
                f"{BASE_URL}/api/transactions",
                json=transaction_data,
                headers=headers
            )
            if response.status_code in [200, 201]:
                transaction = response.json()
                print(f"✅ Created over-budget transaction: {transaction['description']} (${abs(transaction['amount']):.2f})")
            else:
                print(f"❌ Failed to create transaction: {response.status_code}")
        except Exception as e:
            print(f"❌ Error creating transaction: {e}")
    
    # Refresh budget amounts
    print("\n🔄 Refreshing budget spent amounts...")
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
    print("🚨 Creating over-budget example...")
    create_over_budget_example()
    print("\n✅ Over-budget scenario created! Food budget should now be over limit.") 