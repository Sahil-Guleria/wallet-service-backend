#!/bin/sh
set -e

echo "Running database migrations..."
npx sequelize-cli db:migrate

echo "Starting the application..."
exec node src/index.js
