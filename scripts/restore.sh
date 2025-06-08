#!/bin/bash

# Kubera Database Restore Script
# Usage: ./restore.sh [backup_file]

set -e

# Configuration
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="kubera_prod"
DB_USER="kubera_user"
BACKUP_DIR="/backup"

# Function to show usage
show_usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 kubera_backup_20250608_143000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/kubera_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
}

# Check if backup file is provided
if [[ $# -eq 0 ]]; then
    show_usage
fi

BACKUP_FILE="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Check if backup file exists
if [[ ! -f "$BACKUP_PATH" ]]; then
    echo "❌ Backup file not found: $BACKUP_PATH"
    show_usage
fi

echo "=== Kubera Database Restore Started: $(date) ==="
echo "Restoring from: $BACKUP_FILE"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "PostgreSQL is not ready - sleeping..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Confirm restore operation
echo "⚠️  WARNING: This will completely replace the current database!"
echo "Current database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to proceed? (type 'yes' to confirm): " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Decompress and restore
echo "Decompressing and restoring backup..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Compressed backup
    gunzip -c "$BACKUP_PATH" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres
else
    # Uncompressed backup
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -f "$BACKUP_PATH"
fi

# Verify restoration
echo "Verifying restoration..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM accounts;" > /dev/null 2>&1; then
    echo "✅ Database restored successfully!"
    
    # Show basic stats
    echo ""
    echo "Database statistics after restore:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 'Accounts' as table_name, COUNT(*) as records FROM accounts
        UNION ALL
        SELECT 'Transactions', COUNT(*) FROM transactions
        UNION ALL
        SELECT 'Goals', COUNT(*) FROM goals
        UNION ALL
        SELECT 'Categories', COUNT(*) FROM categories;
    "
else
    echo "❌ Database restoration verification failed!"
    exit 1
fi

echo "=== Kubera Database Restore Completed: $(date) ===" 