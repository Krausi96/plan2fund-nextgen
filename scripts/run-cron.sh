#!/bin/bash
# Simple cron runner - Just runs the scraper

cd "$(dirname "$0")/.."
npm run scraper:run

