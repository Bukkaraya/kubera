#!/bin/bash

# Kubera SQLite Database Restore Script
# Usage: ./sqlite-restore.sh [backup_file]

set -e

# Configuration
DB_FILE="/data/kubera.db"
BACKUP_DIR="/backup"

# Function to show usage
show_usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 kubera_backup_20250608_143000.db.gz"
    echo ""
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/kubera_backup_*.db.gz 2>/dev/null || echo "No backups found"
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

echo "=== Kubera SQLite Database Restore Started: $(date) ==="
echo "Restoring from: $BACKUP_FILE"

# Show current database info
if [[ -f "$DB_FILE" ]]; then
    CURRENT_SIZE=$(du -h "$DB_FILE" | cut -f1)
    echo "📊 Current database size: $CURRENT_SIZE"
    
    # Create a safety backup of current database
    SAFETY_BACKUP="$BACKUP_DIR/pre_restore_backup_$(date +%Y%m%d_%H%M%S).db"
    echo "🔒 Creating safety backup of current database: $(basename $SAFETY_BACKUP)"
    cp "$DB_FILE" "$SAFETY_BACKUP"
else
    echo "📊 No existing database found"
fi

# Confirm restore operation
echo ""
echo "⚠️  WARNING: This will completely replace the current database!"
echo "Current database: $DB_FILE"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to proceed? (type 'yes' to confirm): " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Create data directory if it doesn't exist
mkdir -p "$(dirname "$DB_FILE")"

# Decompress and restore
echo "Decompressing and restoring backup..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Compressed backup
    gunzip -c "$BACKUP_PATH" > "$DB_FILE"
else
    # Uncompressed backup
    cp "$BACKUP_PATH" "$DB_FILE"
fi

# Verify restoration
echo "Verifying restoration..."
if [[ -f "$DB_FILE" ]]; then
    RESTORED_SIZE=$(du -h "$DB_FILE" | cut -f1)
    echo "✅ Database restored successfully!"
    echo "📊 Restored database size: $RESTORED_SIZE"
    
    # Try to open the database to verify integrity
    if command -v sqlite3 &> /dev/null; then
        echo "🔍 Checking database integrity..."
        if sqlite3 "$DB_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
            echo "✅ Database integrity check passed"
            
            # Show basic stats if possible
            echo ""
            echo "Database statistics after restore:"
            sqlite3 "$DB_FILE" "
                SELECT 'Accounts' as table_name, COUNT(*) as records FROM accounts
                UNION ALL
                SELECT 'Transactions', COUNT(*) FROM transactions  
                UNION ALL
                SELECT 'Goals', COUNT(*) FROM goals
                UNION ALL
                SELECT 'Categories', COUNT(*) FROM categories;
            " 2>/dev/null || echo "Could not retrieve table statistics"
        else
            echo "❌ Database integrity check failed!"
            exit 1
        fi
    else
        echo "⚠️  SQLite3 not available for integrity check, but file restored"
    fi
else
    echo "❌ Database restoration failed!"
    exit 1
fi

echo "=== Kubera SQLite Database Restore Completed: $(date) ===" 