#!/usr/bin/env bash
# Exit on error
set -o errexit

npm ci
npx sequelize-cli db:migrate
