# Online Wiki Database

uses SQLite and TS for CLI

## Installation
```bash
npm install
```

## Database Schema & Data
1. see `database/schema.sql`
2. Generate the SQLite database plus sample data:
   ```bash
   npm run seed:dev   
   ```
   see the populated file at `database/wiki.db`.

## Running the Test Queries
```bash
npm run run:queries
```
executes all five queries listed in `queries/test-queries.sql`

## Application Interfaces
Each CLI compiles to `dist/interfaces/*.js`. You can either run the TypeScript source or build first.

1: task=user-management, source=interfaces/user-management.ts, command=npm run cli:user-management
2: task=article-editor, source=interfaces/article-editor.ts, command=npm run cli:article-editor
3: task=article-browser, source=interfaces/article-browser.ts, command=npm run cli:article-browser
4: task=category-manager, source=interfaces/category-manager.ts, command=npm run cli:category-manager
5: task=admin-dashboard, source=interfaces/admin-dashboard.ts, command=npm run cli:admin-dashboard

All interfaces share the same connection helper, so run commands from the project root to ensure the database path resolves correctly.


## Troubleshooting
- If `better-sqlite3` fails to build, ensure a local build toolchain (Python + make + C++ compiler) is available. macOS with Command Line Tools works out of the box.
- Re-run `npm run seed:dev` whenever you change the schema to refresh the dataset.
