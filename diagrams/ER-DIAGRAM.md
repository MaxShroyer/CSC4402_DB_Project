# Entity-Relationship Diagram - Online Wiki Database

## Visual Representation

This document provides a detailed textual representation of the E-R diagram for the Online Wiki Database System. For the report, you may want to create a visual diagram using tools like:
- Draw.io (diagrams.net)
- Lucidchart
- ERDPlus
- dbdiagram.io

## Entities and Attributes

### 1. USER_ROLES
**Attributes:**
- **role_id** (PK) - Integer, auto-increment
- role_name - Text, unique
- can_create_articles - Boolean
- can_edit_articles - Boolean
- can_delete_articles - Boolean
- can_moderate - Boolean
- can_admin - Boolean
- description - Text, nullable

**Purpose:** Defines permission levels for different user types in the wiki system.

---

### 2. USERS
**Attributes:**
- **user_id** (PK) - Integer, auto-increment
- username - Text, unique, not null
- email - Text, unique, not null
- password_hash - Text, not null
- role_id (FK) - References USER_ROLES.role_id
- bio - Text, nullable
- created_at - Timestamp, default current
- last_login - Timestamp, nullable
- is_active - Boolean, default true

**Purpose:** Stores user account information and authentication data.

---

### 3. CATEGORIES
**Attributes:**
- **category_id** (PK) - Integer, auto-increment
- category_name - Text, unique, not null
- description - Text, nullable
- parent_category_id (FK) - References CATEGORIES.category_id (self-referencing)
- created_at - Timestamp, default current

**Purpose:** Provides hierarchical organization of article topics.

---

### 4. ARTICLES
**Attributes:**
- **article_id** (PK) - Integer, auto-increment
- title - Text, not null
- slug - Text, unique, not null
- author_id (FK) - References USERS.user_id
- created_at - Timestamp, default current
- updated_at - Timestamp, default current
- is_published - Boolean, default true
- is_locked - Boolean, default false
- view_count - Integer, default 0

**Purpose:** Represents the main wiki content pages.

---

### 5. REVISIONS
**Attributes:**
- **revision_id** (PK) - Integer, auto-increment
- article_id (FK) - References ARTICLES.article_id
- editor_id (FK) - References USERS.user_id
- content - Text, not null
- revision_comment - Text, nullable
- created_at - Timestamp, default current
- word_count - Integer, default 0

**Purpose:** Maintains complete edit history for version control.

---

### 6. COMMENTS
**Attributes:**
- **comment_id** (PK) - Integer, auto-increment
- article_id (FK) - References ARTICLES.article_id
- user_id (FK) - References USERS.user_id
- parent_comment_id (FK) - References COMMENTS.comment_id (self-referencing)
- content - Text, not null
- created_at - Timestamp, default current
- updated_at - Timestamp, default current
- is_deleted - Boolean, default false

**Purpose:** Enables discussions on articles with nested replies.

---

### 7. TAGS
**Attributes:**
- **tag_id** (PK) - Integer, auto-increment
- tag_name - Text, unique, not null
- description - Text, nullable
- created_at - Timestamp, default current

**Purpose:** Provides flexible, non-hierarchical content labeling.

---

### 8. ARTICLE_CATEGORIES (Junction Table)
**Attributes:**
- **article_id** (PK, FK) - References ARTICLES.article_id
- **category_id** (PK, FK) - References CATEGORIES.category_id

**Composite Primary Key:** (article_id, category_id)

**Purpose:** Implements many-to-many relationship between articles and categories.

---

### 9. ARTICLE_TAGS (Junction Table)
**Attributes:**
- **article_id** (PK, FK) - References ARTICLES.article_id
- **tag_id** (PK, FK) - References TAGS.tag_id

**Composite Primary Key:** (article_id, tag_id)

**Purpose:** Implements many-to-many relationship between articles and tags.

---

### 10. PAGE_LINKS (Junction Table)
**Attributes:**
- **source_article_id** (PK, FK) - References ARTICLES.article_id
- **target_article_id** (PK, FK) - References ARTICLES.article_id
- created_at - Timestamp, default current

**Composite Primary Key:** (source_article_id, target_article_id)

**Constraint:** source_article_id ≠ target_article_id

**Purpose:** Implements many-to-many self-referencing relationship for inter-article links.

---

### 11. MEDIA
**Attributes:**
- **media_id** (PK) - Integer, auto-increment
- article_id (FK) - References ARTICLES.article_id
- uploader_id (FK) - References USERS.user_id
- filename - Text, not null
- file_type - Text, not null
- file_size - Integer, not null
- file_path - Text, not null
- alt_text - Text, nullable
- created_at - Timestamp, default current

**Purpose:** Manages file attachments (images, documents) for articles.

---

### 12. VIEW_STATISTICS
**Attributes:**
- **stat_id** (PK) - Integer, auto-increment
- article_id (FK) - References ARTICLES.article_id
- user_id (FK) - References USERS.user_id (nullable)
- viewed_at - Timestamp, default current
- ip_address - Text, nullable
- user_agent - Text, nullable

**Purpose:** Tracks page views for analytics.

---

## Relationships

### 1. USER_ROLES → USERS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One role can be assigned to many users; each user has exactly one role
- **Foreign Key:** USERS.role_id → USER_ROLES.role_id
- **Delete Rule:** RESTRICT (cannot delete role if users exist with that role)

---

### 2. USERS → ARTICLES
- **Type:** One-to-Many (1:N)
- **Cardinality:** One user can author many articles; each article has exactly one author
- **Foreign Key:** ARTICLES.author_id → USERS.user_id
- **Delete Rule:** CASCADE (deleting user deletes their articles)
- **Participation:** Partial on both sides (users may have 0+ articles)

---

### 3. USERS → REVISIONS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One user can create many revisions; each revision has exactly one editor
- **Foreign Key:** REVISIONS.editor_id → USERS.user_id
- **Delete Rule:** CASCADE (deleting user deletes their revisions)
- **Participation:** Partial on both sides

---

### 4. USERS → COMMENTS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One user can post many comments; each comment has exactly one author
- **Foreign Key:** COMMENTS.user_id → USERS.user_id
- **Delete Rule:** CASCADE (deleting user deletes their comments)
- **Participation:** Partial on both sides

---

### 5. ARTICLES → REVISIONS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One article must have at least one revision; can have many revisions
- **Foreign Key:** REVISIONS.article_id → ARTICLES.article_id
- **Delete Rule:** CASCADE (deleting article deletes all its revisions)
- **Participation:** Total on revision side (every revision belongs to an article)

---

### 6. ARTICLES → COMMENTS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One article can have many comments; each comment belongs to one article
- **Foreign Key:** COMMENTS.article_id → ARTICLES.article_id
- **Delete Rule:** CASCADE (deleting article deletes all its comments)
- **Participation:** Total on comment side

---

### 7. ARTICLES ↔ CATEGORIES
- **Type:** Many-to-Many (M:N)
- **Implementation:** Via ARTICLE_CATEGORIES junction table
- **Cardinality:** One article can belong to multiple categories; one category can contain multiple articles
- **Foreign Keys:** 
  - ARTICLE_CATEGORIES.article_id → ARTICLES.article_id (CASCADE)
  - ARTICLE_CATEGORIES.category_id → CATEGORIES.category_id (CASCADE)
- **Participation:** At least one category per article (enforced at application level)

---

### 8. ARTICLES ↔ TAGS
- **Type:** Many-to-Many (M:N)
- **Implementation:** Via ARTICLE_TAGS junction table
- **Cardinality:** One article can have multiple tags; one tag can apply to multiple articles
- **Foreign Keys:**
  - ARTICLE_TAGS.article_id → ARTICLES.article_id (CASCADE)
  - ARTICLE_TAGS.tag_id → TAGS.tag_id (CASCADE)
- **Participation:** Partial on both sides (articles may have 0+ tags)

---

### 9. CATEGORIES → CATEGORIES (Self-Referencing)
- **Type:** One-to-Many (1:N) recursive
- **Cardinality:** One category can be the parent of many child categories; each category has at most one parent
- **Foreign Key:** CATEGORIES.parent_category_id → CATEGORIES.category_id
- **Delete Rule:** SET NULL (deleting parent makes children top-level categories)
- **Participation:** Partial (not all categories have parents)

---

### 10. COMMENTS → COMMENTS (Self-Referencing)
- **Type:** One-to-Many (1:N) recursive
- **Cardinality:** One comment can have many replies; each reply has at most one parent
- **Foreign Key:** COMMENTS.parent_comment_id → COMMENTS.comment_id
- **Delete Rule:** CASCADE (deleting comment deletes all replies)
- **Participation:** Partial (not all comments are replies)

---

### 11. ARTICLES ↔ ARTICLES (Self-Referencing)
- **Type:** Many-to-Many (M:N) recursive
- **Implementation:** Via PAGE_LINKS junction table
- **Cardinality:** One article can link to many articles; one article can be linked by many articles
- **Foreign Keys:**
  - PAGE_LINKS.source_article_id → ARTICLES.article_id (CASCADE)
  - PAGE_LINKS.target_article_id → ARTICLES.article_id (CASCADE)
- **Constraint:** Article cannot link to itself (CHECK constraint)
- **Participation:** Partial on both sides

---

### 12. ARTICLES → MEDIA
- **Type:** One-to-Many (1:N)
- **Cardinality:** One article can have many media attachments; each media belongs to one article
- **Foreign Key:** MEDIA.article_id → ARTICLES.article_id
- **Delete Rule:** CASCADE (deleting article deletes its media)
- **Participation:** Partial (articles may have 0+ media)

---

### 13. USERS → MEDIA
- **Type:** One-to-Many (1:N)
- **Cardinality:** One user can upload many media files; each media has one uploader
- **Foreign Key:** MEDIA.uploader_id → USERS.user_id
- **Delete Rule:** CASCADE (deleting user deletes their uploads)
- **Participation:** Partial on both sides

---

### 14. ARTICLES → VIEW_STATISTICS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One article can have many view records; each view belongs to one article
- **Foreign Key:** VIEW_STATISTICS.article_id → ARTICLES.article_id
- **Delete Rule:** CASCADE (deleting article deletes its view statistics)
- **Participation:** Partial (new articles may have no views yet)

---

### 15. USERS → VIEW_STATISTICS
- **Type:** One-to-Many (1:N)
- **Cardinality:** One user can have many view records; each view may be from one user
- **Foreign Key:** VIEW_STATISTICS.user_id → USERS.user_id (nullable)
- **Delete Rule:** SET NULL (preserve anonymous view stats if user deleted)
- **Participation:** Partial (anonymous views have null user_id)

---

## Constraints Summary

### Primary Keys
- All tables have single-column auto-increment primary keys except junction tables
- Junction tables use composite primary keys

### Foreign Keys
- 15 foreign key relationships ensure referential integrity
- Cascade rules maintain data consistency on deletion

### Unique Constraints
- Usernames, emails, slugs, role names, category names, tag names must be unique
- Prevents duplicate entries

### Check Constraints
- PAGE_LINKS: source_article_id ≠ target_article_id (no self-links)

### Default Values
- Timestamps default to current time
- Boolean flags have appropriate defaults
- Counters default to 0

---

## Normalization

The schema is normalized to **Third Normal Form (3NF)**:

1. **1NF**: All attributes contain atomic values
2. **2NF**: No partial dependencies (all non-key attributes depend on entire primary key)
3. **3NF**: No transitive dependencies (non-key attributes don't depend on other non-key attributes)

**Example of normalization:**
- User roles separated from users table (avoiding role attribute repetition)
- Article-category and article-tag relationships in separate junction tables (avoiding multi-valued attributes)
- Revision history in separate table (avoiding repeating groups in articles table)

---

## Visual Diagram Instructions

To create a visual E-R diagram, include:

1. **Entities**: Rectangles containing entity name and key attributes
2. **Relationships**: Diamonds or labeled lines between entities
3. **Cardinalities**: 1:1, 1:N, M:N labels on relationship lines
4. **Primary Keys**: Underlined or marked with (PK)
5. **Foreign Keys**: Marked with (FK) and arrows to referenced table
6. **Attributes**: Listed within or near entities

**Recommended Layout:**
- Place USER_ROLES and USERS at the top
- ARTICLES in the center (hub of the system)
- Related entities (REVISIONS, COMMENTS, MEDIA, VIEW_STATISTICS) around ARTICLES
- Junction tables (ARTICLE_CATEGORIES, ARTICLE_TAGS, PAGE_LINKS) between their connected entities
- CATEGORIES and TAGS on the sides

---

## Implementation Notes

- SQLite stores booleans as integers (0 = false, 1 = true)
- Timestamps stored as ISO 8601 strings
- Foreign keys enabled via `PRAGMA foreign_keys = ON`
- Indexes created on all foreign keys for query performance
- Full-text search capabilities through FTS5 virtual table (optional)

