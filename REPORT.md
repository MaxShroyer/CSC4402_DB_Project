# Online Wiki Database System - Project Report
**CSC4103 Semester Project**

## 1. Description of Enterprise (2 points)

### Background
The **Online Wiki Database System** is designed to support a collaborative knowledge-sharing platform similar to Wikipedia, where users can create, edit, and maintain articles on various topics. This enterprise serves educational institutions, organizations, or communities that need a structured system for documenting and sharing knowledge collaboratively.

### Operation
The wiki operates through several key functions:

1. **User Management**: Multiple user roles (Admin, Moderator, Editor, Contributor, Reader) with different permission levels
2. **Content Creation**: Users create articles organized by categories and tagged for easy discovery
3. **Version Control**: Every edit creates a new revision, maintaining complete edit history
4. **Collaboration**: Users can comment on articles, link related pages, and contribute collectively
5. **Content Organization**: Articles are organized through categories (hierarchical) and tags (flexible)
6. **Media Management**: Support for attachments and images associated with articles
7. **Analytics**: Track page views and user activity for insights

### Need for Database
A database is essential for this enterprise because:

- **Data Relationships**: Complex relationships exist between users, articles, revisions, comments, categories, and tags that require relational integrity
- **Concurrent Access**: Multiple users need to read and write simultaneously without conflicts
- **Version Control**: Historical data (revisions) must be preserved for accountability and rollback capabilities
- **Search & Retrieval**: Efficient querying across thousands of articles, comments, and revisions
- **Data Integrity**: Foreign key constraints ensure referential integrity (e.g., articles can't reference non-existent users)
- **Scalability**: As content grows to hundreds of articles and thousands of edits, structured storage becomes critical
- **Access Control**: Role-based permissions require structured user and role management
- **Analytics**: Aggregation queries for statistics on views, contributions, and popular content

Without a database, managing these interconnected data points, ensuring consistency, and providing fast access would be impractical.

---

## 2. E-R Diagram (2 points)

### Entity-Relationship Diagram

The following E-R diagram represents the complete database structure:

```
┌─────────────────┐         ┌──────────────────┐
│   USER_ROLES    │         │      USERS       │
├─────────────────┤         ├──────────────────┤
│ *role_id (PK)   │◄───────┤│ *user_id (PK)    │
│  role_name      │       1:N│  username        │
│  can_create     │         │  email           │
│  can_edit       │         │  password_hash   │
│  can_delete     │         │ +role_id (FK)    │
│  can_moderate   │         │  bio             │
│  can_admin      │         │  created_at      │
│  description    │         │  last_login      │
└─────────────────┘         │  is_active       │
                            └──────────────────┘
                                 │  │  │
                    ┌────────────┘  │  └──────────────┐
                    │                │                 │
                  1:N              1:N               1:N
                    │                │                 │
                    ▼                ▼                 ▼
         ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
         │    ARTICLES      │  │  REVISIONS   │  │   COMMENTS   │
         ├──────────────────┤  ├──────────────┤  ├──────────────┤
         │ *article_id (PK) │  │ *revision_id │  │ *comment_id  │
         │  title           │  │ +article_id  │  │ +article_id  │
         │  slug            │  │ +editor_id   │  │ +user_id     │
         │ +author_id (FK)  │  │  content     │  │  parent_id   │
         │  created_at      │  │  revision_   │  │  content     │
         │  updated_at      │  │   comment    │  │  created_at  │
         │  is_published    │  │  created_at  │  │  updated_at  │
         │  is_locked       │  │  word_count  │  │  is_deleted  │
         │  view_count      │  └──────────────┘  └──────────────┘
         └──────────────────┘         ▲                 ▲
              │  │  │  │              │                 │
              │  │  │  └──────────────┘                 │
              │  │  │                1:N                │
              │  │  └───────────────────────────────────┘
              │  │                    1:N
              │  │
              │  └────────────M:N───────────────┐
              │                                  │
            M:N                                M:N
              │                                  │
              ▼                                  ▼
    ┌──────────────────┐              ┌────────────────┐
    │   CATEGORIES     │              │     TAGS       │
    ├──────────────────┤              ├────────────────┤
    │ *category_id(PK) │              │ *tag_id (PK)   │
    │  category_name   │              │  tag_name      │
    │  description     │              │  description   │
    │ +parent_cat_id   │◄──┐          │  created_at    │
    │  created_at      │   │          └────────────────┘
    └──────────────────┘   │
            │              │
            └──────────────┘
              (Self-ref 1:N)

    ┌──────────────────┐              ┌──────────────────┐
    │   PAGE_LINKS     │              │      MEDIA       │
    ├──────────────────┤              ├──────────────────┤
    │+source_art_id(PK)│              │ *media_id (PK)   │
    │+target_art_id(PK)│              │ +article_id (FK) │
    │  created_at      │              │ +uploader_id(FK) │
    └──────────────────┘              │  filename        │
            ▲  ▲                      │  file_type       │
            │  │                      │  file_size       │
       M:N  │  │  M:N                 │  file_path       │
  (Article)│  │(Article)              │  alt_text        │
            │  │                      │  created_at      │
            └──┴───ARTICLES           └──────────────────┘
                                               ▲
                                               │
                                             1:N
                                               │
    ┌────────────────────┐                    │
    │ VIEW_STATISTICS    │                    │
    ├────────────────────┤                    │
    │ *stat_id (PK)      │                    │
    │ +article_id (FK)   ├────────────────────┘
    │ +user_id (FK)      │
    │  viewed_at         │
    │  ip_address        │
    │  user_agent        │
    └────────────────────┘
```

### Entity Descriptions

1. **USER_ROLES**: Defines permission levels (Admin, Moderator, Editor, Contributor, Reader)
2. **USERS**: Wiki users with authentication and role assignment
3. **ARTICLES**: Main wiki content pages with metadata
4. **REVISIONS**: Complete edit history for every article change
5. **CATEGORIES**: Hierarchical topic organization (supports parent-child relationships)
6. **TAGS**: Flexible, non-hierarchical content labels
7. **COMMENTS**: User discussions on articles (supports nested replies)
8. **PAGE_LINKS**: Inter-article references (self-referencing many-to-many)
9. **MEDIA**: File attachments (images, documents) linked to articles
10. **VIEW_STATISTICS**: Page view tracking for analytics

### Key Relationships

- **Users 1:N Articles**: One user authors many articles
- **Users 1:N Revisions**: One user creates many edits
- **Users 1:N Comments**: One user posts many comments
- **Articles 1:N Revisions**: One article has many revision history entries
- **Articles 1:N Comments**: One article receives many comments
- **Articles M:N Categories**: Articles belong to multiple categories; categories contain multiple articles
- **Articles M:N Tags**: Articles have multiple tags; tags apply to multiple articles
- **Articles M:N Articles** (via PAGE_LINKS): Articles link to other articles (self-referencing)
- **Categories 1:N Categories**: Categories can have parent categories (hierarchical)
- **Articles 1:N Media**: One article has multiple media attachments
- **Articles 1:N View_Statistics**: One article has many view records

### Cardinality Constraints

- User → Articles: 1:N (one user authors zero or many articles)
- User → Revisions: 1:N (one user creates zero or many revisions)
- Article → Revisions: 1:N (one article must have at least one revision, can have many)
- Role → Users: 1:N (one role assigned to many users)
- Article ↔ Category: M:N (minimum 1 category per article)
- Article ↔ Tag: M:N (zero or many tags per article)

---

## 3. Relational Schema (1 point)

### Schema Definitions

**USER_ROLES** (_role_id_, role_name, can_create_articles, can_edit_articles, can_delete_articles, can_moderate, can_admin, description)
- Primary Key: role_id
- Unique: role_name

**USERS** (_user_id_, username, email, password_hash, role_id, bio, created_at, last_login, is_active)
- Primary Key: user_id
- Foreign Key: role_id → USER_ROLES(role_id)
- Unique: username, email

**CATEGORIES** (_category_id_, category_name, description, parent_category_id, created_at)
- Primary Key: category_id
- Foreign Key: parent_category_id → CATEGORIES(category_id) [Self-referencing]
- Unique: category_name

**ARTICLES** (_article_id_, title, slug, author_id, created_at, updated_at, is_published, is_locked, view_count)
- Primary Key: article_id
- Foreign Key: author_id → USERS(user_id) ON DELETE CASCADE
- Unique: slug

**REVISIONS** (_revision_id_, article_id, editor_id, content, revision_comment, created_at, word_count)
- Primary Key: revision_id
- Foreign Key: article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: editor_id → USERS(user_id) ON DELETE CASCADE

**COMMENTS** (_comment_id_, article_id, user_id, parent_comment_id, content, created_at, updated_at, is_deleted)
- Primary Key: comment_id
- Foreign Key: article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: user_id → USERS(user_id) ON DELETE CASCADE
- Foreign Key: parent_comment_id → COMMENTS(comment_id) ON DELETE CASCADE [Self-referencing]

**TAGS** (_tag_id_, tag_name, description, created_at)
- Primary Key: tag_id
- Unique: tag_name

**ARTICLE_CATEGORIES** (_article_id_, _category_id_)
- Composite Primary Key: (article_id, category_id)
- Foreign Key: article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: category_id → CATEGORIES(category_id) ON DELETE CASCADE

**ARTICLE_TAGS** (_article_id_, _tag_id_)
- Composite Primary Key: (article_id, tag_id)
- Foreign Key: article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: tag_id → TAGS(tag_id) ON DELETE CASCADE

**PAGE_LINKS** (_source_article_id_, _target_article_id_, created_at)
- Composite Primary Key: (source_article_id, target_article_id)
- Foreign Key: source_article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: target_article_id → ARTICLES(article_id) ON DELETE CASCADE
- Check Constraint: source_article_id ≠ target_article_id

**MEDIA** (_media_id_, article_id, uploader_id, filename, file_type, file_size, file_path, alt_text, created_at)
- Primary Key: media_id
- Foreign Key: article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: uploader_id → USERS(user_id) ON DELETE CASCADE

**VIEW_STATISTICS** (_stat_id_, article_id, user_id, viewed_at, ip_address, user_agent)
- Primary Key: stat_id
- Foreign Key: article_id → ARTICLES(article_id) ON DELETE CASCADE
- Foreign Key: user_id → USERS(user_id) ON DELETE SET NULL

---

## 4. Test Queries (1 point)

### Query 1: Complex JOIN - Articles with Author Info and Metadata

**Purpose**: Retrieve articles with author details, categories, and revision count

```sql
SELECT 
    a.article_id,
    a.title,
    a.slug,
    u.username AS author,
    u.email AS author_email,
    GROUP_CONCAT(DISTINCT c.category_name, ', ') AS categories,
    COUNT(DISTINCT r.revision_id) AS revision_count,
    a.view_count,
    a.created_at,
    a.updated_at
FROM articles a
JOIN users u ON a.author_id = u.user_id
LEFT JOIN article_categories ac ON a.article_id = ac.article_id
LEFT JOIN categories c ON ac.category_id = c.category_id
LEFT JOIN revisions r ON a.article_id = r.article_id
WHERE a.is_published = 1
GROUP BY a.article_id
ORDER BY a.view_count DESC
LIMIT 20;
```

**Sample Output**:
| article_id | title | author | categories | revision_count | view_count |
|------------|-------|--------|------------|----------------|------------|
| 45 | Introduction to Quantum Computing | john_doe | Science, Technology, Physics | 8 | 9854 |
| 78 | History of Ancient Rome | historian_mary | History, Geography | 12 | 8723 |
| 23 | Machine Learning Basics | ai_expert | Technology, Computer Science | 15 | 7456 |

### Query 2: Aggregation - Most Active Contributors

**Purpose**: Rank users by their editing activity

```sql
SELECT 
    u.user_id,
    u.username,
    ur.role_name,
    COUNT(DISTINCT r.revision_id) AS total_edits,
    COUNT(DISTINCT a.article_id) AS articles_created,
    COUNT(DISTINCT c.comment_id) AS comments_posted
FROM users u
JOIN user_roles ur ON u.role_id = ur.role_id
LEFT JOIN revisions r ON u.user_id = r.editor_id
LEFT JOIN articles a ON u.user_id = a.author_id
LEFT JOIN comments c ON u.user_id = c.user_id
WHERE u.is_active = 1
GROUP BY u.user_id
HAVING total_edits > 0
ORDER BY total_edits DESC
LIMIT 15;
```

**Sample Output**:
| username | role_name | total_edits | articles_created | comments_posted |
|----------|-----------|-------------|------------------|-----------------|
| super_editor | Editor | 127 | 23 | 45 |
| content_king | Moderator | 98 | 15 | 67 |
| wiki_wizard | Contributor | 76 | 34 | 12 |

### Query 3: Subquery - Articles Above Average Views

**Purpose**: Find popular articles exceeding average view count

```sql
SELECT 
    a.article_id,
    a.title,
    a.view_count,
    u.username AS author,
    (SELECT AVG(view_count) FROM articles WHERE is_published = 1) AS avg_views,
    GROUP_CONCAT(DISTINCT t.tag_name, ', ') AS tags
FROM articles a
JOIN users u ON a.author_id = u.user_id
LEFT JOIN article_tags at ON a.article_id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.tag_id
WHERE a.is_published = 1 
    AND a.view_count > (SELECT AVG(view_count) FROM articles WHERE is_published = 1)
GROUP BY a.article_id
ORDER BY a.view_count DESC
LIMIT 25;
```

**Sample Output**:
| title | view_count | avg_views | author | tags |
|-------|------------|-----------|--------|------|
| Climate Change Overview | 8956 | 2341.5 | scientist_jane | environment, science, policy |
| Web Development Guide | 7834 | 2341.5 | dev_master | programming, web, tutorial |

### Query 4: Date-based - Recent Activity (Last 30 Days)

**Purpose**: Show all recent activity (articles, edits, comments)

```sql
SELECT 
    'Article Created' AS activity_type,
    a.article_id AS item_id,
    a.title AS item_title,
    u.username AS user,
    a.created_at AS activity_date
FROM articles a
JOIN users u ON a.author_id = u.user_id
WHERE a.created_at >= datetime('now', '-30 days')

UNION ALL

SELECT 
    'Article Edited' AS activity_type,
    r.article_id,
    a.title,
    u.username,
    r.created_at
FROM revisions r
JOIN articles a ON r.article_id = a.article_id
JOIN users u ON r.editor_id = u.user_id
WHERE r.created_at >= datetime('now', '-30 days')

UNION ALL

SELECT 
    'Comment Posted' AS activity_type,
    c.article_id,
    a.title,
    u.username,
    c.created_at
FROM comments c
JOIN articles a ON c.article_id = a.article_id
JOIN users u ON c.user_id = u.user_id
WHERE c.created_at >= datetime('now', '-30 days')

ORDER BY activity_date DESC
LIMIT 50;
```

**Sample Output**:
| activity_type | item_title | user | activity_date |
|---------------|------------|------|---------------|
| Article Edited | Python Tutorial | coder_bob | 2024-10-20 14:23:45 |
| Comment Posted | Python Tutorial | learner_sam | 2024-10-20 12:15:32 |
| Article Created | Data Science Intro | analyst_emma | 2024-10-19 09:45:11 |

### Query 5: Article Search with Full Metadata

**Purpose**: Search articles with comprehensive metadata (links, views, comments)

```sql
SELECT 
    a.article_id,
    a.title,
    u.username AS author,
    a.view_count,
    COUNT(DISTINCT cm.comment_id) AS comment_count,
    COUNT(DISTINCT r.revision_id) AS revision_count,
    (SELECT COUNT(*) FROM page_links WHERE source_article_id = a.article_id) AS outgoing_links,
    (SELECT COUNT(*) FROM page_links WHERE target_article_id = a.article_id) AS incoming_links
FROM articles a
JOIN users u ON a.author_id = u.user_id
LEFT JOIN comments cm ON a.article_id = cm.article_id
LEFT JOIN revisions r ON a.article_id = r.article_id
WHERE a.is_published = 1 
    AND (a.title LIKE '%science%' OR a.title LIKE '%technology%')
GROUP BY a.article_id
ORDER BY a.view_count DESC
LIMIT 20;
```

**Sample Output**:
| title | author | view_count | comments | revisions | outgoing_links | incoming_links |
|-------|--------|------------|----------|-----------|----------------|----------------|
| Computer Science Fundamentals | prof_tech | 6745 | 23 | 11 | 8 | 15 |
| Life Sciences Research | bio_researcher | 5432 | 17 | 9 | 5 | 7 |

---

## 5. Application User Interfaces (2 points)

### Interface 1: User Management

**Purpose**: Create, update, and delete user accounts with role assignment

**Features**:
- List all users with their roles and status
- Create new users with username, email, password, role, and bio
- Update user information (email, role, bio, active status)
- Delete users (cascades to their content)
- View user roles and permissions

**User Interactions**:
1. Select action from menu (List, Create, Update, Delete, Exit)
2. For Create: Enter user details, select role from dropdown, set initial status
3. For Update: Search by ID, modify fields, confirm changes
4. For Delete: Select user, view confirmation with impact warning

**Screenshot/Description**:
```
╔════════════════════════════════════════╗
║   Online Wiki - User Management        ║
╚════════════════════════════════════════╝

? What would you like to do? › 
  ❯ List Users
    Create User
    Update User
    Delete User
    Exit

=== Users List ===
ID | Username | Email | Role | Active | Created At
1 | admin_user | admin@wiki.com | Admin | Yes | 2024-01-15 10:23:45
2 | editor_jane | jane@wiki.com | Editor | Yes | 2024-02-20 14:30:12
...
```

### Interface 2: Article Editor

**Purpose**: Create new articles and edit existing ones with version control

**Features**:
- Create new articles with title, content, categories, and tags
- Search and edit existing articles
- Automatic slug generation from title
- Revision tracking with comments
- Word count calculation
- Category and tag assignment via multi-select
- Delete articles with confirmation

**User Interactions**:
1. Choose between Create, Edit, or Delete
2. For Create: Enter title and content, select author, choose categories/tags, set publish status
3. For Edit: Search article by title, view current content, make changes, add revision comment
4. For Delete: Search article, view details, confirm deletion

**Screenshot/Description**:
```
╔════════════════════════════════════════╗
║   Online Wiki - Article Editor         ║
╚════════════════════════════════════════╝

=== Create New Article ===
? Select user: › admin_user (admin@wiki.com)
? Article title: › Introduction to Database Systems
? Article content: › [Multi-line text input]
? Revision comment: › Initial version
? Publish immediately? › Yes

? Select categories (space to select, enter to confirm): ›
◉ Technology
◯ Science
◉ Computer Science
◯ History

✓ Article created successfully!
  Article ID: 125
  Slug: introduction-to-database-systems-k7m3n9
  Word count: 1247
```

### Interface 3: Article Browser

**Purpose**: Browse, search, and view articles with full details

**Features**:
- Browse articles by: Most Recent, Most Viewed, Most Edited
- Filter by category or tag
- Search articles by title
- View article details including content, metadata, revision history, and comments
- Automatic view tracking when viewing articles
- Display article statistics (views, revisions, comments)

**User Interactions**:
1. Choose browsing method (recent, popular, by category, by tag, search)
2. View list of articles with summary information
3. Select article ID to view full details
4. View displays: title, author, content, categories, tags, revisions, comments

**Screenshot/Description**:
```
╔════════════════════════════════════════╗
║   Online Wiki - Article Browser        ║
╚════════════════════════════════════════╝

? Browse articles by: › Most Viewed

=== Articles ===
ID | Title | Author | Views | Revisions | Updated
45 | Introduction to Quantum Computing | john_doe | 9854 | 8 | 2024-10-15
78 | History of Ancient Rome | historian_mary | 8723 | 12 | 2024-10-18

? Enter article ID to view details (0 to skip): › 45

================================================================================
ARTICLE: Introduction to Quantum Computing
================================================================================
Author: john_doe (john@wiki.com)
Created: 2024-09-01 10:00:00 | Updated: 2024-10-15 14:30:00
Views: 9855 | Published: Yes | Locked: No
Categories: Science, Technology, Physics
Tags: quantum, computing, physics, technology

--- Latest Content ---
Last edited by: editor_sarah on 2024-10-15 14:30:00
Word count: 2341

Quantum computing is a revolutionary approach to computation...
[Content continues...]

--- Revision History ---
1. Rev #234 - editor_sarah on 2024-10-15: Updated statistics
2. Rev #198 - john_doe on 2024-10-01: Added examples section
...

--- Recent Comments ---
1. physics_student on 2024-10-16: Great explanation! Could you add...
2. curious_reader on 2024-10-14: This helped me understand quantum gates...
```

### Interface 4: Category Manager

**Purpose**: Organize content through category creation and management

**Features**:
- List all categories with article counts
- Create new categories (with optional parent category)
- Update category name, description, and hierarchy
- Delete categories (removes from articles but doesn't delete articles)
- Manage article-category associations
- Support for hierarchical categories (parent-child relationships)

**User Interactions**:
1. Select action (List, Create, Update, Delete, Manage Article Categories)
2. For Create: Enter name, description, optionally select parent category
3. For Update: Select category, modify fields
4. For Manage: Search article, multi-select categories to assign

**Screenshot/Description**:
```
╔════════════════════════════════════════╗
║   Online Wiki - Category Manager       ║
╚════════════════════════════════════════╝

=== Categories ===
ID | Name | Parent | Articles | Description
1 | Science | None | 45 | Scientific topics and research
2 | Physics | Science | 23 | Physics-related articles
3 | Technology | None | 67 | Technology and computing

=== Manage Article Categories ===
? Search for article: › quantum
? Select article: › Introduction to Quantum Computing

Current categories: Science, Technology, Physics

? Select categories (space to select, enter to confirm): ›
◉ Science
◉ Technology
◉ Physics
◉ Computer Science

✓ Article categories updated! (4 categories assigned)
```

### Interface 5: Admin Dashboard

**Purpose**: View system statistics and manage content moderation

**Features**:
- Database statistics (users, articles, revisions, comments, tags, categories)
- Top contributors by edit count
- Most popular articles by views
- Recent activity across the system (last 7 days)
- Category distribution visualization
- Content management: Lock/unlock articles, publish/unpublish, delete comments, deactivate users

**User Interactions**:
1. Select view type from dashboard menu
2. View Statistics: Display comprehensive database metrics
3. View Contributors: See top editors and their contribution counts
4. View Popular: See most-viewed articles with engagement metrics
5. Manage Content: Moderate articles, comments, and users

**Screenshot/Description**:
```
╔════════════════════════════════════════╗
║   Online Wiki - Admin Dashboard        ║
╚════════════════════════════════════════╝

=== Database Statistics ===

👥 Users:
   Total: 60
   Active: 57
   New (last 30 days): 8

📄 Articles:
   Total: 120
   Published: 108
   Locked: 6
   Total Views: 234567
   Average Views: 1955

📝 Revisions:
   Total: 542
   Articles with revisions: 120
   Average word count: 1847
   Revisions (last 7 days): 34

💬 Comments:
   Total: 190
   Active: 182
   Unique commenters: 45

🏷️  Taxonomy:
   Categories: 15
   Tags: 30
   Article-Category mappings: 267
   Article-Tag mappings: 489

=== Top Contributors ===
Username | Role | Articles | Edits | Comments
super_editor | Editor | 23 | 127 | 45
content_king | Moderator | 15 | 98 | 67
wiki_wizard | Contributor | 34 | 76 | 12

=== Category Distribution ===
Category | Articles | Percentage
Technology | 67 | 25.09% ████████████
Science | 45 | 16.85% ████████
History | 38 | 14.23% ███████
```

---

## 6. Participation Details (2 points)

### Team Member: [Your Name]

**Role**: Full Stack Database Developer

**Tasks and Responsibilities**:
1. **Database Design** (20%)
   - Created comprehensive E-R diagram with 10 entities
   - Designed relational schema with proper normalization (3NF)
   - Implemented SQLite schema with constraints and indexes

2. **Data Generation** (15%)
   - Developed TypeScript data seeding script using Faker.js
   - Generated 60 users, 120 articles, 400-600 revisions, 200 comments, 5000 view statistics
   - Ensured referential integrity across all tables

3. **Query Development** (15%)
   - Wrote 5 test queries covering JOINs, aggregations, subqueries, date filtering
   - Created query execution script with formatted output
   - Tested and optimized query performance

4. **User Interface Development** (30%)
   - Built 5 CLI interfaces using TypeScript and Prompts library
   - Implemented CRUD operations for users, articles, categories
   - Developed article browsing and admin dashboard with analytics
   - Integrated database operations with proper error handling

5. **Documentation** (20%)
   - Wrote comprehensive project report with E-R diagram and schema descriptions
   - Created detailed README with setup and usage instructions
   - Documented all queries with sample outputs
   - Provided interface descriptions with usage examples

**Time Investment**: Approximately 25-30 hours over 3 weeks

**Key Contributions**:
- Designed scalable database architecture supporting collaborative editing
- Implemented comprehensive version control through revisions table
- Created intuitive CLI interfaces for all user types (readers, editors, admins)
- Ensured data integrity through foreign keys and cascade rules

---

## Conclusion

This Online Wiki Database System demonstrates a complete relational database implementation with proper design, comprehensive data, functional queries, and user-friendly interfaces. The system supports collaborative content creation with version control, flexible organization through categories and tags, and robust user management with role-based permissions. The database architecture is scalable and maintains data integrity through well-defined relationships and constraints.

