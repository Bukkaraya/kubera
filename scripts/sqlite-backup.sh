#!/bin/bash

# Kubera SQLite Database Backup Script
# Usage: Run manually or via cron for automated backups

set -e

# Configuration
DB_FILE="/data/kubera.db"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kubera_backup_${DATE}.db"
COMPRESSED_FILE="kubera_backup_${DATE}.db.gz"

# Retention settings (days)
RETENTION_DAYS=30

echo "=== Kubera SQLite Database Backup Started: $(date) ==="

# Check if database file exists
if [[ ! -f "$DB_FILE" ]]; then
    echo "❌ Database file not found: $DB_FILE"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create the backup (simple file copy for SQLite)
echo "Creating database backup..."
cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_FILE"

# Verify the backup was created
if [[ -f "$BACKUP_DIR/$BACKUP_FILE" ]]; then
    echo "✅ Database copied successfully: $BACKUP_FILE"
    
    # Get database size info
    ORIGINAL_SIZE=$(du -h "$DB_FILE" | cut -f1)
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "📊 Original database size: $ORIGINAL_SIZE"
    echo "📊 Backup file size: $BACKUP_SIZE"
    
    # Compress the backup
    echo "Compressing backup..."
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    
    if [[ -f "$BACKUP_DIR/$COMPRESSED_FILE" ]]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
        echo "✅ Backup compressed successfully: $COMPRESSED_FILE ($COMPRESSED_SIZE)"
    else
        echo "❌ Compression failed!"
        exit 1
    fi
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep only last RETENTION_DAYS days)
echo "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "kubera_backup_*.db.gz" -type f -mtime +$RETENTION_DAYS -delete

# List current backups
echo "Current backups:"
ls -lah "$BACKUP_DIR"/kubera_backup_*.db.gz 2>/dev/null || echo "No backups found"

# Show backup summary
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/kubera_backup_*.db.gz 2>/dev/null | wc -l)
echo "📈 Total backups available: $BACKUP_COUNT"

echo "=== Kubera SQLite Database Backup Completed: $(date) ===" 