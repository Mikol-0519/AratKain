# AratKain (web)

AratKain is a cafe and restaurant navigator. This folder contains the React
web client: it uses Supabase for authentication and saved places, and a Spring
Boot API for the establishment catalogue and nearby search.

The other clients live in [`../AratKain-Backend/`](../AratKain-Backend/) and
[`../AratKain-Android/`](../AratKain-Android/).

## Features

- Sign up, log in, and reset a password through Supabase Auth
- Browse the establishment catalogue and find nearby places on a Leaflet map
- Search real cafes, restaurants and bars from OpenStreetMap; results are saved locally so you can favorite them
- See place type, rating, distance, and opening status when the API provides them
- Save and unsave places (stored in the shared Supabase `favorites` table)
- Edit username, full name, and profile photo

## Stack

React 19, TypeScript, Leaflet, and Supabase JS on the frontend; Spring Boot on
the backend. The app is built with Create React App (`react-scripts`).

## Project structure

```
src/
├── features/
│   ├── auth/           # landing, login, register, profile, reset-password
│   │   ├── components/ # shared auth UI
│   │   ├── machines/   # auth state machines
│   │   ├── pages/      # screens
│   │   ├── services/   # Supabase client and auth calls
│   │   ├── styles/     # auth styles
│   │   ├── types/      # shared types
│   │   └── utils/      # password policy
│   └── discovery/      # map, place list, favourites, profile
│       ├── components/ # icons, cards, sidebar
│       ├── domain/     # place types and helpers
│       ├── machines/   # discovery state machines
│       ├── pages/      # screens
│       └── styles/     # discovery styles
├── setupProxy.js       # /api -> localhost:8080 in development
└── index.tsx
```

Every screen is modelled as an explicit, typed state machine. See
[`../STATE-MACHINES.md`](../STATE-MACHINES.md) for the index of states and
transitions across all three clients.

## Setup

Prerequisites: Node.js with npm, Java 17+, and Maven 3.8+ for the backend.

1. Install dependencies in this folder:

   ```bash
   npm install
   ```

2. Set the Supabase values in `.env`:

   ```properties
   REACT_APP_SUPABASE_URL=your_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run `../AratKain-Backend/sql/migrations/003_establishments_osm_id.sql` in
   the Supabase SQL Editor. Search imports real OpenStreetMap places and needs
   that column to avoid importing the same place twice.

4. Start the backend from `../AratKain-Backend/` so the catalogue, search and
   nearby endpoints are available on port 8080:

   ```bash
   mvn spring-boot:run
   ```

5. Run the web app:

   ```bash
   npm start
   ```

   The dev server proxies `/api` requests to `http://localhost:8080` through
   `src/setupProxy.js`. See [`../LOCALDEV.md`](../LOCALDEV.md) for the shared
   local-development setup, including the Docker Compose option.

## Checks

```bash
npm test              # unit tests (CI=true for a single non-watch run)
npx tsc --noEmit      # type check
npm run build         # production build
```

## Documentation

- [`../STATE-MACHINES.md`](../STATE-MACHINES.md) — state machines across the three clients
- [`../SECURITY.md`](../SECURITY.md) — Supabase configuration and the removed password-reset RPC
- [`../LOCALDEV.md`](../LOCALDEV.md) — local URLs, environment values, and emulator paths

## License

For educational use.
