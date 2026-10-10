# Library Management System

College Assignment-4: a React client and Express REST API for a library. The current implementation is a foundation only. Book CRUD, authentication, search, and borrowing remain planned.

## Team

| Member | GitHub | Roll number | Proposed feature ownership |
| --- | --- | --- | --- |
| Anshu Raj Bisoyi (Team Lead) | [anshurajbisoyi98-ctrl](https://github.com/anshurajbisoyi98-ctrl) | Pending | Foundation, integration testing, deployment and submission; issues, reviews and merges |
| Harsh Surana | [Harshsurana-hub](https://github.com/Harshsurana-hub) | Pending | Authentication, borrowing API |
| Dhruv Tomar | [dhruvtomar2006-debug](https://github.com/dhruvtomar2006-debug) | Pending | Book CRUD API, catalog/search interface |
| Kiran Sinha | [KiranSinha872](https://github.com/KiranSinha872) | Pending | Login/Admin book interface, borrowing interface and integration |

Four members are confirmed, including team lead Anshu Raj Bisoyi. All roll numbers are pending. Sixteen issues are published; Anshu’s four are assigned, while contributor assignments await collaborator access. Anshu will manage the repository, issues, reviews, merges and submission regardless of the proposed feature split.

## Stack and structure

React + Vite, JavaScript/JSX, React Router, Fetch, Node.js, Express, MongoDB Atlas + Mongoose, dotenv and CORS. frontend/src contains pages/components/services; backend/src contains configuration, middleware and server; docs contains the proposed API contract and issue roadmap. Models/routes/controllers are added with their features.

## Setup

Use a currently supported Node.js LTS runtime with npm. Development checks were run using the available Node 26 runtime; deployment on LTS still needs checking.

```sh
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set real local values in backend/.env. MONGO_URI is your Atlas connection string; JWT_SECRET must be a unique random secret of at least 32 characters; FRONTEND_URL is the frontend origin without a trailing slash; PORT defaults to 5000. VITE_API_URL is the public API base URL, ending in /api; frontend environment variables are public, so never put secrets there. Restrict Atlas access to the backend's required network and use a dedicated database user. Never commit .env.

Run in two terminals:

```sh
npm run dev:backend
npm run dev:frontend
```

The backend connects to MongoDB before listening. The homepage checks GET /api/health. Missing environment configuration or failed database connection stops startup. Database connection failures use safe messages without printing credentials.

```sh
npm test
npm run build
```

Foundation tests need no live database and verify configuration failures and safe API errors. They do not establish Atlas integration or feature correctness.

## Coding conventions

The backend follows CommonJS and explicit route/controller/database modules demonstrated in the reference CRUD guide. The React frontend uses ES modules, readable arrow components and async/await. Both supplied study guides inform the route/middleware/controller structure and validation/error-handling conventions. See [coding conventions](docs/CODING-CONVENTIONS.md) for reference examples and implementation rules.

## API and planned features

Implemented: GET /api/health (200 with connected database; 503 otherwise), safe JSON errors and unknown-route handling. Planned: five Book CRUD endpoints, register/login, role middleware, search, and Admin-controlled issue/return. See [API contract](docs/API-CONTRACT.md) and [published issue roadmap](docs/ISSUE-ROADMAP.md).

## Collaboration

Team lead creates the remote repository and reviewed issues; contributors use feature branches and linked PRs. Do not push directly to main. Each member must have at least two meaningful merged PRs. Keep author identity accurate and do not split trivial edits to manufacture contributions. The foundation is published on feature/project-foundation for review into main; feature implementation remains pending.

Suggested protection: require a PR and one approval, passing agreed checks, and block force pushes/deletion on main. Verify settings supported by your repository plan; configure them in repository Settings → Rules/Branches. Another member should review the lead's PRs; the lead reviews and merges contributor PRs. The assignment minimum is eight meaningful merged PRs in total, at least two per member. The team target is now sixteen: four per member, planned in the issue roadmap. Each issue should result in one substantive reviewed and merged PR.

## Deployment and submission

Not deployed. Frontend: Vercel root frontend, build npm run build, output dist; configure VITE_API_URL with the deployed backend /api URL. The included rewrite supports React Router deep links. Backend: Node hosting, root backend, install npm ci from the workspace root where supported, start npm start --workspace backend from root (or npm start from backend); configure PORT, MONGO_URI, JWT_SECRET and FRONTEND_URL. Check hosting workspace support before deploying. Rebuild the frontend after changing its environment values.

Screenshots: pending functioning feature implementation.
GitHub repository: [hospitalmanagemntproject](https://github.com/anshurajbisoyi98-ctrl/hospitalmanagemntproject).
Frontend deployment URL: pending.
Backend deployment URL: pending.

Deadline: 12 October 2026, 9:00 AM (Asia/Kolkata).
Before submission, supply team name, project name, lead/member names and roll numbers, repository URL, backend URL and Vercel URL. Verify deployed feature flows, collect actual screenshots, and confirm contribution history.

Local macOS setup uses API port 5001 because AirPlay occupies port 5000. If needed, set PORT=5001 in backend/.env and VITE_API_URL=http://127.0.0.1:5001/api in frontend/.env. Set FRONTEND_URL to the exact browser origin (currently http://127.0.0.1:5173). These local files stay untracked.

## Authentication UI

Implemented in `feature/auth-ui` (issue #5). Frontend only; the backend auth endpoints (`POST /api/auth/register` and `POST /api/auth/login`) must be supplied by the backend feature branch before end-to-end flows work.

### Routes

| Path | Access | Description |
| --- | --- | --- |
| `/login` | Public | Sign-in form; redirects authenticated users home |
| `/register` | Public | Registration form; redirects authenticated users home |
| `/` | Authenticated | Home page; unauthenticated users redirected to `/login` |

### Session storage

The session is persisted to `localStorage` under the key `lms_session` as `{ token, user }`. On every page load the token's `exp` claim is decoded client-side; an expired token is discarded silently and the user is treated as logged out. Corrupted JSON is caught and discarded. Never put secrets in the frontend environment or `localStorage`.

### 401 / expired-token flow

When any API request that sent a `Bearer` token receives a 401 response, the session is cleared, the user is redirected to `/login` with `{ state: { expired: true } }`, and the login page displays "Your session has expired. Please sign in again." To test this manually, open DevTools → Application → Local Storage, change any character of the stored token, then visit a protected page.

### Password rule

Minimum 8 characters. This must match the backend bcrypt rule when the auth endpoints are implemented. Update the `MIN_PASSWORD` constant in `Login.jsx` and `Register.jsx` if the backend team decides on a different minimum.
