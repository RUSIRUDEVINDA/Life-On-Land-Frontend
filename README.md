# Life On Land Frontend

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=222)](https://react.dev/)
[![License](https://img.shields.io/badge/License-Academic-informational)](#license)

Frontend application for the **Life On Land** platform.  
It provides a role-based wildlife protection dashboard for incident response, patrol coordination, protected area management, alerts, and movement intelligence.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Role-Based Routes](#role-based-routes)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [CI Pipeline](#ci-pipeline)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

This frontend is built with React + Vite and is designed for fast operational workflows in conservation contexts.

It supports:

- Authentication for `ADMIN` and `RANGER`
- Incident monitoring and reporting
- Protected area and zone workflows
- Patrol assignment and field tracking
- Alert monitoring and status updates
- Movement analytics and map-assisted monitoring

## Key Features

- Role-based route protection and dashboard experiences
- Domain-based feature modules under `src/features`
- Shared API client strategy with environment-driven backend URL
- SPA routing support for static hosting via rewrite rules (`vercel.json`)
- CI checks on push and pull request (lint + build)

## Tech Stack

- **Frontend:** React 19, React Router 7
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS
- **Maps & Geo:** Leaflet, React Leaflet, Leaflet Geoman, MapLibre/Mapbox, Turf
- **Networking:** Fetch + Axios
- **Reporting:** jsPDF, jspdf-autotable
- **Quality:** ESLint
- **CI/CD:** GitHub Actions + Vercel

## Project Structure

```text
src/
  components/        Shared UI and layout components
  features/          Domain modules (alerts, incidents, patrols, movements, etc.)
  pages/             Route-level pages
  services/          API service layer
  utils/             Shared utilities
.github/workflows/   CI pipeline definitions
public/              Static assets (favicon, etc.)
```

## Getting Started

### 1. Prerequisites

- Node.js `18+`
- npm `9+`

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Set required values in `.env` (see [Environment Variables](#environment-variables)).

### 4. Run Development Server

```bash
npm run dev
```

Local app URL:

```text
http://localhost:5173
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:5001` | Backend origin for production API calls. Use origin only (without `/api`). |
| `VITE_API_PROXY_TARGET` | No | `http://localhost:5001` | Dev proxy target for Vite (`/api` requests during local development). |
| `VITE_MAPTILER_KEY` | Yes (maps) | empty | Map tile key for map-enabled views. |

Example production value:

```env
VITE_API_URL=https://life-on-land-aqau.onrender.com
```

## Available Scripts

- `npm run dev` - start local dev server
- `npm run start` - alias for `dev`
- `npm run build` - create production build in `dist/`
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint checks

## Role-Based Routes

### Public

- `/login`
- `/register`

### Admin

- `/dashboard/admin`
- `/dashboard/incidents`
- `/dashboard/risk-map`
- `/dashboard/animals`
- `/dashboard/users`
- `/dashboard/alerts`
- `/dashboard/protected-areas/*`
- `/dashboard/patrols/create`

### Ranger

- `/dashboard/ranger`
- `/dashboard/ranger-risk-map`
- `/dashboard/my-incidents`

### Shared (Admin + Ranger)

- `/dashboard/incidents/report`
- `/dashboard/map-tracking`
- `/dashboard/movements`
- `/dashboard/patrols`
- `/dashboard/patrols/:id`
- `/dashboard/profile`

## API Integration

Frontend communicates with backend endpoints under `/api`, including:

- `/api/auth/*`
- `/api/users/*`
- `/api/incidents/*`
- `/api/alerts/*`
- `/api/patrols/*`
- `/api/movements/*`
- `/api/protected-areas/*`
- `/api/zones/*`
- `/api/risk-map*`

Backend base URL is environment-driven via `VITE_API_URL`.

## Deployment

### Backend (already deployed)

Current backend URL:

```text
https://life-on-land-aqau.onrender.com
```

### Frontend on Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in Vercel:
   - `VITE_API_URL=https://life-on-land-aqau.onrender.com`
   - `VITE_MAPTILER_KEY=<your_key>`
5. Deploy.

SPA routing support is preconfigured with `vercel.json` rewrite rules.

## CI Pipeline

GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline steps:

1. Checkout repository
2. Setup Node.js 18 with npm cache
3. Install dependencies (`npm ci`)
4. Lint (`npm run lint`)
5. Build (`npm run build`)

Required GitHub Actions values:

- Repository Variable: `VITE_API_URL`
- Repository Secret: `VITE_MAPTILER_KEY`

## Troubleshooting

- **Blank map tiles:** verify `VITE_MAPTILER_KEY`.
- **API requests failing in production:** verify `VITE_API_URL` and backend CORS settings.
- **Route refresh gives 404 on hosting:** ensure SPA rewrite is configured (already done for Vercel).
- **Auth-related cross-origin issues:** ensure backend cookie/CORS settings match frontend origin.

## License

Academic project repository.
