#!/bin/bash

# Kubera Database Backup Script
# Usage: Run manually or via cron for automated backups

set -e

# Configuration
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="kubera_prod"
DB_USER="kubera_user"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kubera_backup_${DATE}.sql"
COMPRESSED_FILE="kubera_backup_${DATE}.sql.gz"

# Retention settings (days)
RETENTION_DAYS=30

echo "=== Kubera Database Backup Started: $(date) ==="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; do
  echo "PostgreSQL is not ready - sleeping..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create the backup
echo "Creating database backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --verbose \
  --clean \
  --create \
  --if-exists \
  --format=plain \
  --file="$BACKUP_DIR/$BACKUP_FILE"

# Compress the backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Verify the backup was created
if [[ -f "$BACKUP_DIR/$COMPRESSED_FILE" ]]; then
  BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
  echo "✅ Backup created successfully: $COMPRESSED_FILE ($BACKUP_SIZE)"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Clean up old backups (keep only last RETENTION_DAYS days)
echo "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "kubera_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List current backups
echo "Current backups:"
ls -lah "$BACKUP_DIR"/kubera_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "=== Kubera Database Backup Completed: $(date) ===" 