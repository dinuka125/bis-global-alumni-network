#!/bin/bash
# Production startup script for BIS Alumni Network Backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start uvicorn with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2


