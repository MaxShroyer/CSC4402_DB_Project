# Online Wiki Database System

A comprehensive database system for a collaborative online wiki platform with user management, article editing, version control, and analytics.

## Project Structure

```
SemProg/
├── database/
│   ├── schema.sql           # SQLite table definitions
│   ├── seed-data.ts         # Data generation script
│   └── wiki.db              # SQLite database (created after setup)
├── queries/
│   ├── test-queries.sql     # 5 test queries
│   └── run-queries.ts       # Query execution script
├── interfaces/
│   ├── user-management.ts   # User CRUD operations
│   ├── article-editor.ts    # Article creation/editing
│   ├── article-browser.ts   # Article viewing
│   ├── category-manager.ts  # Category management
│   └── admin-dashboard.ts   # Admin statistics and moderation
├── src/
│   ├── db-connection.ts     # Database utility functions
│   └── types.ts             # TypeScript type definitions
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── REPORT.md                # Project report
└── README.md                # This file
```

## Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **TypeScript**: Installed globally or via npm

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `better-sqlite3` - SQLite database driver
- `@faker-js/faker` - Synthetic data generation
- `prompts` - Interactive CLI prompts
- `typescript` - TypeScript compiler
- Type definitions for all dependencies

### 2. Build the Project

```bash
npm run build
```

This compiles all TypeScript files to JavaScript in the `dist/` directory.

### 3. Initialize Database and Generate Data

```bash
npm run setup
```

This command:
1. Creates the SQLite database file (`database/wiki.db`)
2. Executes the schema to create all tables with constraints
3. Generates and inserts synthetic data:
   - 60 users with various roles
   - 120 articles with content
   - 400-600 revisions (edit history)
   - 200 comments
   - 15 categories (some hierarchical)
   - 30 tags
   - 180 media files
   - 5000 view statistics records
   - Multiple article-category and article-tag mappings
   - Inter-article page links

**Note**: The setup process takes about 10-20 seconds. You'll see progress messages as data is generated.

## Running Test Queries

To execute all 5 test queries and view results:

```bash
npm run test-queries
```

This will run:
1. **Query 1**: Complex JOIN - Articles with author info, categories, and revision count
2. **Query 2**: Aggregation - Most active contributors by edit count
3. **Query 3**: Subquery - Articles with above-average view counts
4. **Query 4**: Date-based - Recent activity in the last 30 days
5. **Query 5**: Article search with comprehensive metadata

Each query displays:
- Query description
- Execution time
- Number of results
- Formatted table output (limited to first 10 rows for readability)

## Application User Interfaces

The system provides 5 interactive command-line interfaces:

### 1. User Management Interface

Create, read, update, and delete users with role assignment.

```bash
npm run user-management
```

**Features**:
- List all users with roles and status
- Create new users with username, email, password, role, and bio
- Update user information (email, role, bio, active status)
- Delete users (cascades to their articles and comments)
- View available roles and permissions

**Example Usage**:
1. Select "Create User" from menu
2. Enter username (min 3 characters)
3. Enter email address
4. Enter password (min 6 characters)
5. Select role from list (Admin, Moderator, Editor, Contributor, Reader)
6. Optionally enter bio
7. User created with confirmation message

### 2. Article Editor Interface

Create, edit, and delete wiki articles with version control.

```bash
npm run article-editor
```

**Features**:
- Create new articles with title, content, categories, and tags
- Edit existing articles (creates new revision)
- Search articles by title
- Automatic slug generation
- Word count calculation
- Revision comments for edit history
- Category and tag assignment
- Delete articles with confirmation

**Example Usage for Creating**:
1. Select "Create Article"
2. Choose author from user list
3. Enter article title
4. Enter article content (minimum 50 characters)
5. Enter revision comment (e.g., "Initial version")
6. Choose whether to publish immediately
7. Select categories (minimum 1, can select multiple)
8. Select tags (optional, can select multiple)
9. Article created with ID, slug, and word count displayed

**Example Usage for Editing**:
1. Select "Edit Article"
2. Search for article by title keyword
3. Select article from results
4. View current title and content preview
5. Choose editor from user list
6. Enter new title (or keep current)
7. Enter new content
8. Enter revision comment describing changes
9. New revision saved with updated word count

### 3. Article Browser Interface

Browse, search, and view articles with full details.

```bash
npm run article-browser
```

**Features**:
- Browse by: Most Recent, Most Viewed, Most Edited
- Filter by category or tag
- Search by title keyword
- View complete article details including:
  - Full content
  - Author information
  - Categories and tags
  - View count
  - Complete revision history
  - All comments
- Automatic view tracking

**Example Usage**:
1. Select "Browse Articles"
2. Choose browsing method (e.g., "Most Viewed")
3. View list of articles with summary
4. Enter article ID to view full details
5. See complete article with metadata, revisions, and comments
6. View count automatically increments

### 4. Category Manager Interface

Organize content through category creation and management.

```bash
npm run category-manager
```

**Features**:
- List all categories with article counts
- Create categories with optional parent category (hierarchical)
- Update category name, description, and hierarchy
- Delete categories (removes associations but preserves articles)
- Manage article-category assignments
- View category tree structure

**Example Usage for Creating Category**:
1. Select "Create Category"
2. Enter category name (min 3 characters)
3. Enter optional description
4. Optionally select parent category (for hierarchical structure)
5. Category created with confirmation

**Example Usage for Managing Article Categories**:
1. Select "Manage Article Categories"
2. Search for article by title
3. Select article from results
4. View current categories
5. Multi-select categories to assign (space to select, enter to confirm)
6. Categories updated with count displayed

### 5. Admin Dashboard Interface

View system statistics and manage content moderation.

```bash
npm run admin-dashboard
```

**Features**:
- **Database Statistics**: Comprehensive metrics on users, articles, revisions, comments, taxonomy
- **Top Contributors**: Ranked list of most active users by edit count
- **Popular Articles**: Most viewed articles with engagement metrics
- **Recent Activity**: Activity feed for last 7 days (articles, edits, comments)
- **Category Distribution**: Visual breakdown of articles per category
- **Content Management**:
  - Lock/unlock articles (prevent editing)
  - Publish/unpublish articles (control visibility)
  - Delete comments (mark as deleted)
  - Activate/deactivate users

**Example Usage**:
1. Select view type from menu (e.g., "Database Statistics")
2. View comprehensive metrics with counts and percentages
3. For content management, select "Manage Content"
4. Choose action (e.g., "Lock/Unlock Article")
5. Search for and select item
6. Confirm action

## Database Schema Overview

The database consists of 10 main tables:

### Core Tables
- **user_roles**: Permission definitions (Admin, Moderator, Editor, Contributor, Reader)
- **users**: User accounts with authentication and role assignment
- **articles**: Wiki articles with metadata (title, slug, author, publish status, view count)
- **revisions**: Complete edit history for articles (content, editor, timestamp, word count)
- **comments**: User discussions on articles with nested reply support

### Organization Tables
- **categories**: Hierarchical topic organization (supports parent-child relationships)
- **tags**: Flexible, non-hierarchical content labels

### Relationship Tables
- **article_categories**: Many-to-many mapping between articles and categories
- **article_tags**: Many-to-many mapping between articles and tags
- **page_links**: Many-to-many self-referencing links between articles

### Additional Tables
- **media**: File attachments (images, documents) linked to articles
- **view_statistics**: Page view tracking for analytics

### Key Relationships
- Users → Articles (1:N) - One user authors many articles
- Users → Revisions (1:N) - One user creates many edits
- Articles → Revisions (1:N) - One article has many versions
- Articles ↔ Categories (M:N) - Articles belong to multiple categories
- Articles ↔ Tags (M:N) - Articles have multiple tags
- Articles ↔ Articles (M:N) - Inter-article links

## Test Queries Description

### Query 1: Complex JOIN
Retrieves articles with author details, aggregated categories, and revision count. Demonstrates multi-table JOINs and GROUP BY aggregation.

### Query 2: Aggregation
Ranks users by contribution activity (edits, articles created, comments posted). Shows aggregation across multiple related tables.

### Query 3: Subquery
Finds articles with above-average view counts using subquery in WHERE clause. Calculates percentage above average.

### Query 4: Date-based with UNION
Shows recent activity across different entity types (articles created, edited, commented) using UNION and date filtering.

### Query 5: Search with Metadata
Searches articles by keyword and provides comprehensive metadata including link counts (incoming/outgoing), comment count, and revision count using correlated subqueries.

## Database File Location

After running setup, the SQLite database file is located at:
```
database/wiki.db
```

You can inspect it using:
- SQLite CLI: `sqlite3 database/wiki.db`
- DB Browser for SQLite (GUI)
- Any SQLite-compatible tool

## Troubleshooting

### Build Errors
If you encounter TypeScript compilation errors:
```bash
rm -rf dist/
npm run build
```

### Database Already Exists
If you need to recreate the database:
```bash
rm database/wiki.db
npm run setup
```

### Module Not Found Errors
Ensure all dependencies are installed:
```bash
rm -rf node_modules/
npm install
npm run build
```

### Permission Errors on macOS
If you get permission errors with better-sqlite3:
```bash
npm rebuild better-sqlite3
```

## Technology Stack

- **Database**: SQLite3 (via better-sqlite3)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.4+
- **CLI Framework**: Prompts 2.4+
- **Data Generation**: Faker.js 8.4+

## Project Features

### Database Design
- 10 entities with proper normalization (3NF)
- Foreign key constraints with CASCADE rules
- Indexes on frequently queried columns
- Self-referencing relationships (categories, page links, comments)
- Check constraints for data validation

### Data Integrity
- Referential integrity through foreign keys
- Cascade deletes for dependent data
- Unique constraints on usernames, emails, slugs
- Boolean flags for soft deletes (comments)

### Version Control
- Complete edit history through revisions table
- Revision comments for change tracking
- Word count tracking per revision
- Timestamp tracking for all changes

### User Management
- Role-based access control (5 roles with different permissions)
- User activation/deactivation (soft delete)
- Password hashing simulation
- Bio and profile information

### Content Organization
- Hierarchical categories (parent-child relationships)
- Flexible tagging system
- Many-to-many relationships for classification
- Article slugs for URL-friendly identifiers

### Analytics
- Page view tracking with timestamps
- User agent and IP logging
- View count aggregation
- Activity monitoring

## Performance Considerations

- **Indexes**: Created on foreign keys and frequently searched columns (username, email, slug, dates)
- **Pagination**: Queries use LIMIT to prevent loading excessive data
- **Aggregation**: Proper use of GROUP BY with indexes
- **Cascades**: Efficient deletion of related data through CASCADE rules

## Security Notes

⚠️ **Important**: This is an educational project. For production use, implement:
- Proper password hashing (bcrypt, argon2)
- SQL injection protection (parameterized queries are used)
- Authentication and session management
- Input validation and sanitization
- Rate limiting
- HTTPS for web interfaces

## Future Enhancements

Potential improvements for production deployment:
- Web-based GUI using Express + React
- Full-text search using SQLite FTS5
- Image upload and storage
- Email notifications
- User profiles and avatars
- Article drafts and scheduling
- Markdown rendering
- Diff viewer for revisions
- API endpoints (REST or GraphQL)
- User authentication with JWT
- Role permission customization

## License

This project is created for educational purposes as part of CSC4103 coursework.

## Author

Created for CSC4103 Semester Project - Database Management Systems

## Contact

For questions or issues related to this project, please contact the course instructor or refer to the project documentation.

---

**Last Updated**: October 2024

