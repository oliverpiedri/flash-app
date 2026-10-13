# FLASH App

This repository contains a complete MVP for the FLASH urban mobility app.

## Stack
- Backend: Node.js + Express
- Frontend: static HTML/CSS/JS
- Database: PostgreSQL schema included as SQL file
- Auth: mock JWT-based auth for demo
- Payments: mock payment intent flow
- Maps: demo route placeholders to integrate with Mapbox/Google Maps

## Quick start

1. Install dependencies:
   npm install

2. Start server:
   npm start

3. Open the app:
   http://localhost:3000

## Included features
- Passenger signup/login
- Driver signup/login
- Ride request flow
- ETA and pricing estimate
- Payment flow simulation
- Trip history
- Driver dashboard
- Admin overview
- Promo codes
- Futuristic design system

## Files
- `backend/server.js` — Express API
- `backend/dataStore.js` — in-memory store for demo data
- `public/index.html` — app shell
- `public/styles.css` — dark futuristic theme
- `public/app.js` — UI and API calls
- `sql/schema.sql` — PostgreSQL schema starter
- `.env.example` — env variables

## Notes
This is a demo MVP. For production, replace in-memory storage with PostgreSQL/Supabase and integrate real payment providers, maps, and notification systems.
