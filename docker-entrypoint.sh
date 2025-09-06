#!/bin/sh

# Wait for a few seconds to ensure database is ready
sleep 5

# Start the application
exec "$@"