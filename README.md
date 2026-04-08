# Life On Land Frontend

Life On Land is a wildlife protection dashboard focused on anti-poaching response, patrol coordination, protected area management, incident reporting, alert handling, and animal movement tracking.

This repository contains the React + Vite frontend application.

## Overview

The frontend provides:

- Role-based access for ADMIN and RANGER users
- Incident reporting and incident queue management
- Protected area and zone management with map drawing/editing
- Risk map and movement tracking views
- Patrol creation, assignment, check-ins, and monitoring
- Alert monitoring and status updates
- User management and profile management

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Axios
- Leaflet + React Leaflet + Leaflet Geoman
- Tailwind CSS
- jsPDF + jspdf-autotable (PDF export)

## Project Structure

Core folders:

- src/pages: route-level pages
- src/features: domain modules (alerts, incidents, movements, patrols, protected-areas, users)
- src/components: shared UI and dashboard components
- src/services: API service modules
- src/utils: shared utility functions

## Prerequisites

- Node.js 18+
- npm 9+
- Backend API running on port 5001 (or set a custom API URL)

## Environment Variables

Copy .env.example to .env and adjust values for your local or deployed environment.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| VITE_API_URL | No | http://localhost:5001 | Base backend origin used by API clients and auth pages |
| VITE_API_PROXY_TARGET | No | http://localhost:5001 | Vite dev proxy target for /api requests |
| VITE_MAPTILER_KEY | Yes for map tiles | (empty) | API key for MapTiler-based map views |

Notes:

- In development, Vite proxy is configured for /api requests in vite.config.js.
- If VITE_API_URL is omitted, frontend modules fall back to localhost backend defaults.

## Local Setup

1. Install dependencies:

	npm install

2. Create env file:

	copy .env.example .env

3. Start development server:

	npm run dev

4. Open the app:

	http://localhost:5173

## Available Scripts

- npm run dev: start Vite development server
- npm run build: create production build in dist
- npm run preview: preview production build locally
- npm run lint: run ESLint checks

## Routing and Access Control

High-level route behavior is defined in src/App.jsx:

- Public routes: /login, /register
- Protected dashboard wrapper: /dashboard/*
- ADMIN-only routes for management screens
- RANGER-only routes for ranger dashboard screens
- Shared ADMIN/RANGER routes for common workflows

Authentication and role checks are handled by:

- src/components/auth/ProtectedRoute.jsx
- src/components/auth/RoleRoute.jsx
- src/utils/auth.js

## API Integration Summary

The frontend communicates with backend REST endpoints under /api.

Main endpoint groups used by the frontend:

- /api/auth/* (login/register)
- /api/users/*
- /api/incidents/*
- /api/alerts/*
- /api/patrols/*
- /api/movements/*
- /api/protected-areas/*
- /api/zones/*
- /api/risk-map*

Key integration files:

- src/services/apiClient.js
- src/services/protectedAreaService.js
- src/features/incidents/api/incidentsApi.js
- src/features/alerts/api/alertsApi.js
- src/features/patrols/api/patrolsApi.js
- src/features/movements/api/movementsApi.js
- src/features/risk-map/api/riskMapApi.js
- src/features/users/api/usersApi.js

## Build and Quality Status

Current checks:

- Production build: passing
- Lint: has existing errors that should be resolved before final submission

Recommended pre-submission command sequence:

1. npm run lint
2. npm run build
3. npm run preview

## Deployment Guide

### Frontend Deployment (Vercel or Netlify)

1. Connect repository to hosting platform.
2. Configure build settings:
	- Build command: npm run build
	- Output directory: dist
3. Add environment variables in hosting dashboard:
	- VITE_API_URL=<your deployed backend base URL>
	- VITE_MAPTILER_KEY=<your key>
4. Deploy and verify critical routes:
	- /login
	- /dashboard/admin (ADMIN)
	- /dashboard/ranger (RANGER)

### Backend Connectivity Checklist

- Backend CORS allows frontend domain
- Auth cookies or auth headers work cross-origin in production
- API base URL is HTTPS in production

## Demonstration Checklist (For Evaluation)

Capture and include evidence for:

1. Successful local build output (npm run build)
2. Lint status output (npm run lint)
3. Login flow for ADMIN and RANGER
4. Incident create/update flow
5. Protected area + zone create/edit flow
6. Patrol creation and check-in flow
7. Movement/risk map visualization
8. Deployed frontend URL and screenshots

## Known Notes

- Vite may report large chunk-size warnings in production build; this is a performance optimization task, not a build blocker.
- Map and geometry workflows rely on valid GeoJSON Polygon/MultiPolygon structures.

## License

Academic project repository.
