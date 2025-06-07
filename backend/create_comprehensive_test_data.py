#!/usr/bin/env python3
"""
Create comprehensive test data for Kubera backend
"""
import requests
import json
from datetime import datetime, timedelta

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

def create_categories(token):
    """Create comprehensive categories"""
    headers = {"Authorization": f"Bearer {token}"}
    
    categories = [
        {"name": "Food & Dining", "description": "Restaurants, groceries, and food expenses"},
        {"name": "Transportation", "description": "Gas, public transit, car maintenance"}, 
        {"name": "Housing", "description": "Rent, utilities, home maintenance"},
        {"name": "Entertainment", "description": "Movies, games, subscriptions"},
        {"name": "Healthcare", "description": "Medical expenses, insurance, pharmacy"},
        {"name": "Shopping", "description": "Clothing, electronics, misc purchases"},
        {"name": "Utilities", "description": "Electricity, water, internet, phone"},
        {"name": "Salary", "description": "Monthly salary and bonuses"},
        {"name": "Freelance", "description": "Freelance and side income"},
        {"name": "Investment", "description": "Investment returns and dividends"}
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
    headers = {"Authorization": f"Bearer {token}"}
    
    accounts = [
        {"name": "Chase Checking", "account_type": "checking", "initial_balance": 2500.00, "description": "Main checking account"},
        {"name": "Savings Account", "account_type": "savings", "initial_balance": 15000.00, "description": "Emergency fund savings"},
        {"name": "Investment Account", "account_type": "investment", "initial_balance": 25000.00, "description": "Stock and bond investments"},
        {"name": "Credit Card", "account_type": "credit_card", "initial_balance": 0.00, "description": "Chase Freedom credit card"},
        {"name": "Cash Wallet", "account_type": "cash", "initial_balance": 200.00, "description": "Physical cash on hand"}
    ]
    
    created_accounts = []
    
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
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Find specific categories and accounts
    checking_account = next((a for a in accounts if "checking" in a['name'].lower()), accounts[0])
    savings_account = next((a for a in accounts if "savings" in a['name'].lower()), accounts[1])
    credit_account = next((a for a in accounts if "credit" in a['name'].lower()), accounts[-1])
    
    food_category = next((c for c in categories if "food" in c['name'].lower()), categories[0])
    transport_category = next((c for c in categories if "transport" in c['name'].lower()), categories[1])
    housing_category = next((c for c in categories if "housing" in c['name'].lower()), categories[2])
    salary_category = next((c for c in categories if "salary" in c['name'].lower()), categories[-3])
    entertainment_category = next((c for c in categories if "entertainment" in c['name'].lower()), categories[3])
    
    now = datetime.now()
    
    transactions = [
        # Income transactions
        {
            "amount": 5000.00,
            "description": "Monthly Salary",
            "transaction_date": (now - timedelta(days=5)).isoformat(),
            "is_income": True,
            "account_id": checking_account['id'],
            "category_id": salary_category['id'],
            "notes": "December salary payment"
        },
        {
            "amount": 800.00,
            "description": "Freelance Project",
            "transaction_date": (now - timedelta(days=10)).isoformat(),
            "is_income": True,
            "account_id": checking_account['id'],
            "category_id": next((c for c in categories if "freelance" in c['name'].lower()), categories[0])['id'],
            "notes": "Web development project"
        },
        
        # Expense transactions
        {
            "amount": -1200.00,
            "description": "Monthly Rent",
            "transaction_date": (now - timedelta(days=3)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": housing_category['id'],
            "notes": "December rent payment"
        },
        {
            "amount": -85.50,
            "description": "Grocery Store",
            "transaction_date": (now - timedelta(days=1)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": food_category['id'],
            "notes": "Weekly grocery shopping at Whole Foods"
        },
        {
            "amount": -45.00,
            "description": "Gas Station",
            "transaction_date": (now - timedelta(days=2)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": transport_category['id'],
            "notes": "Fill up gas tank"
        },
        {
            "amount": -25.99,
            "description": "Netflix Subscription",
            "transaction_date": (now - timedelta(days=7)).isoformat(),
            "is_income": False,
            "account_id": credit_account['id'],
            "category_id": entertainment_category['id'],
            "notes": "Monthly Netflix subscription"
        },
        {
            "amount": -120.00,
            "description": "Electric Bill",
            "transaction_date": (now - timedelta(days=8)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": next((c for c in categories if "utilities" in c['name'].lower()), categories[0])['id'],
            "notes": "Monthly electricity bill"
        },
        {
            "amount": -65.00,
            "description": "Internet Bill",
            "transaction_date": (now - timedelta(days=9)).isoformat(),
            "is_income": False,
            "account_id": checking_account['id'],
            "category_id": next((c for c in categories if "utilities" in c['name'].lower()), categories[0])['id'],
            "notes": "Monthly internet service"
        }
    ]
    
    created_transactions = []
    
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
                income_type = "income" if transaction['is_income'] else "expense"
                print(f"✅ Created {income_type}: {transaction['description']} (${abs(transaction['amount'])})")
            else:
                print(f"❌ Failed to create transaction {transaction_data['description']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating transaction {transaction_data['description']}: {e}")
    
    return created_transactions

def create_budgets(token, categories):
    """Create test budgets"""
    if not categories:
        print("❌ Cannot create budgets without categories")
        return []
    
    headers = {"Authorization": f"Bearer {token}"}
    now = datetime.now()
    
    # Create budgets for different categories
    budget_configs = [
        {"category_name": "food", "name": "Monthly Food Budget", "amount": 400.00},
        {"category_name": "transport", "name": "Transportation Budget", "amount": 200.00},
        {"category_name": "entertainment", "name": "Entertainment Budget", "amount": 150.00},
        {"category_name": "shopping", "name": "Shopping Budget", "amount": 300.00},
        {"category_name": "utilities", "name": "Utilities Budget", "amount": 250.00}
    ]
    
    created_budgets = []
    
    for budget_config in budget_configs:
        # Find the category
        category = next((c for c in categories if budget_config["category_name"] in c['name'].lower()), None)
        if not category:
            print(f"❌ Category not found for {budget_config['name']}")
            continue
            
        budget_data = {
            "name": budget_config["name"],
            "amount": budget_config["amount"],
            "period_year": now.year,
            "period_month": now.month,
            "category_id": category['id']
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/budgets/",
                json=budget_data,
                headers=headers
            )
            if response.status_code in [200, 201]:
                budget = response.json()
                created_budgets.append(budget)
                print(f"✅ Created budget: {budget['name']} (${budget['amount']})")
            else:
                print(f"❌ Failed to create budget {budget_data['name']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error creating budget {budget_data['name']}: {e}")
    
    return created_budgets

def main():
    print("🚀 Creating comprehensive test data for Kubera backend...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return
    
    # Create categories
    print("\n📁 Creating categories...")
    categories = create_categories(token)
    
    # Create accounts  
    print("\n💳 Creating accounts...")
    accounts = create_accounts(token)
    
    # Create transactions
    print("\n💰 Creating transactions...")
    transactions = create_transactions(token, accounts, categories)
    
    # Create budgets
    print("\n📊 Creating budgets...")
    budgets = create_budgets(token, categories)
    
    print(f"\n🎉 Comprehensive test data creation complete!")
    print(f"   Categories: {len(categories)}")
    print(f"   Accounts: {len(accounts)}")
    print(f"   Transactions: {len(transactions)}")
    print(f"   Budgets: {len(budgets)}")
    
    print(f"\n📈 Summary:")
    print(f"   Total Income: ${sum(t['amount'] for t in transactions if t['is_income']):.2f}")
    print(f"   Total Expenses: ${abs(sum(t['amount'] for t in transactions if not t['is_income'])):.2f}")
    print(f"   Total Budget Allocated: ${sum(b['amount'] for b in budgets):.2f}")

if __name__ == "__main__":
    main() 