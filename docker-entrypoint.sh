#!/bin/sh
echo "Running admin seeder..."
npm run seed:dev || echo "Seeder skipped or already seeded."
echo "Starting application..."
exec npm run start:dev
