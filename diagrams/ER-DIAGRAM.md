# Online Wiki E-R Diagram

```mermaid
erDiagram
    USERS ||--|{ USER_ROLES : has
    USERS ||--o{ ARTICLES : writes
    USERS ||--o{ COMMENTS : authors
    ARTICLES ||--o{ COMMENTS : receives
    ARTICLES ||--o{ ARTICLE_CATEGORIES : labeled_with
    CATEGORIES ||--o{ ARTICLE_CATEGORIES : groups

    USERS {
        int id PK
        string username
        string email
        string display_name
        text bio
        text join_date
        boolean is_active
    }

    USER_ROLES {
        int user_id PK, FK
        string role
        text assigned_at
    }

    ARTICLES {
        int id PK
        string title
        string slug
        text summary
        text content
        boolean published
        text created_at
        text updated_at
        int author_id FK
    }

    CATEGORIES {
        int id PK
        string name
        text description
        text created_at
    }

    ARTICLE_CATEGORIES {
        int article_id PK, FK
        int category_id PK, FK
    }

    COMMENTS {
        int id PK
        int article_id FK
        int author_id FK
        text body
        text created_at
    }
```

**Notes**
- `USER_ROLES` enforces a single role per user while allowing cascading deletes when a user is removed.
- `ARTICLE_CATEGORIES` resolves the many-to-many relationship between `ARTICLES` and `CATEGORIES`.
- `COMMENTS` references both `USERS` and `ARTICLES` to preserve conversational context.
