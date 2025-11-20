# Online Wiki Database Project Report

## 1. Enterprise Description (2 pts)
Online Wiki is a lightweight knowledge base that allows community members to draft, categorize, and discuss short-form reference articles. Editors continuously add new pages, administrators monitor activity, and casual readers leave feedback through comments. A relational database is necessary to keep user accounts, permission levels, articles, categories, and discussion threads synchronized while avoiding duplicate entries. SQLite keeps the deployment simple for the course while still enforcing referential integrity across the six core entities.

## 2. E-R Diagram (2 pts)
The complete diagram is stored in `diagrams/ER-DIAGRAM.md` and summarized below:
- `USERS` owns a mandatory one-to-one `USER_ROLES` relationship that records each member's current capabilities.
- `USERS` write many `ARTICLES` and many `COMMENTS`.
- `ARTICLES` receive many `COMMENTS` and are labeled through the `ARTICLE_CATEGORIES` junction table.
- `CATEGORIES` can apply to many `ARTICLES` via `ARTICLE_CATEGORIES`.

## 3. Relational Schema (1 pt)
- `USERS(id PK, username UNIQUE, email UNIQUE, display_name, bio, join_date, is_active)`
- `USER_ROLES(user_id PK/FK → USERS.id, role ENUM('admin','editor','viewer'), assigned_at)`
- `CATEGORIES(id PK, name UNIQUE, description, created_at)`
- `ARTICLES(id PK, title, slug UNIQUE, summary, content, published, created_at, updated_at, author_id FK → USERS.id)`
- `ARTICLE_CATEGORIES(article_id PK/FK → ARTICLES.id, category_id PK/FK → CATEGORIES.id)`
- `COMMENTS(id PK, article_id FK → ARTICLES.id, author_id FK → USERS.id, body, created_at)`

## 4. Test Queries (1 pt)
All SQL is in `queries/test-queries.sql` and can be executed with `npm run run:queries`. Sample outcomes from the seeded database (index plus key/value pairs):
1: query=Articles grouped by category, category=music, title=cognomen verto urbanus usus subnecto tenuis, author=Clinton Stark, published=yes, created_at=2024-06-01T05:36:01Z
2: query=Article overview with comment counts, title=auctus deprecator aeternus stillicidium canto corrumpo ustilo, author=Mrs. Alma Hauck PhD, created_at=2024-11-07T11:28:35Z, updated_at=2024-11-07T11:28:35Z, comment_count=6
3: query=Most active contributors, display_name=Kim O'Reilly, role=admin, articles_written=5
4: query=Recently commented articles, title=crux commodo sublime deserunt certus, commenter=Clinton Stark, body=Quasi tam unus quis contigo torqueo crapula neque cum., created_at=2025-11-19T22:24:04Z
5: query=Category coverage report, category=music, total_articles=20, pct_of_articles=50.00

## 5. Application User Interfaces (2 pts)
Each CLI uses the `prompts` library for a simple text workflow:
1. `interfaces/user-management.ts` — create new users, toggle active status, and adjust roles.
2. `interfaces/article-editor.ts` — CRUD interface for articles, including category assignments.
3. `interfaces/article-browser.ts` — search articles, read full content, and inspect discussion threads.
4. `interfaces/category-manager.ts` — create categories and manage article/category mappings.
5. `interfaces/admin-dashboard.ts` — show operational statistics, top authors, and recent comments.

Illustrations for each action are provided through interactive console menus; screenshots are not required for this submission.

## 6. Participation Details (2 pts)
- **Max Smith** — solo contributor. Responsibilities included schema design, data generation, SQL test coverage, CLI implementation, and documentation.
