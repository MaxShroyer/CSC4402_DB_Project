-- Test Queries for Online Wiki Database
-- CSC4103 Semester Project

-- Query 1: Complex JOIN - Get articles with author info, categories, and revision count
-- This query demonstrates multiple JOINs and aggregation
SELECT 
    a.article_id,
    a.title,
    a.slug,
    u.username AS author,
    u.email AS author_email,
    GROUP_CONCAT(DISTINCT c.category_name) AS categories,
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
GROUP BY a.article_id, a.title, a.slug, u.username, u.email, a.view_count, a.created_at, a.updated_at
ORDER BY a.view_count DESC
LIMIT 20;

-- Query 2: Aggregation - Most active contributors by edit count
-- This query ranks users by their contribution activity
SELECT 
    u.user_id,
    u.username,
    u.email,
    ur.role_name,
    COUNT(DISTINCT r.revision_id) AS total_edits,
    COUNT(DISTINCT a.article_id) AS articles_created,
    COUNT(DISTINCT c.comment_id) AS comments_posted,
    u.created_at AS member_since
FROM users u
JOIN user_roles ur ON u.role_id = ur.role_id
LEFT JOIN revisions r ON u.user_id = r.editor_id
LEFT JOIN articles a ON u.user_id = a.author_id
LEFT JOIN comments c ON u.user_id = c.user_id
WHERE u.is_active = 1
GROUP BY u.user_id, u.username, u.email, ur.role_name, u.created_at
HAVING total_edits > 0
ORDER BY total_edits DESC, articles_created DESC
LIMIT 15;

-- Query 3: Subquery - Articles with above-average view counts
-- This query uses a subquery to find popular articles
SELECT 
    a.article_id,
    a.title,
    a.view_count,
    u.username AS author,
    (SELECT AVG(view_count) FROM articles WHERE is_published = 1) AS avg_views,
    ROUND(a.view_count * 100.0 / (SELECT AVG(view_count) FROM articles WHERE is_published = 1), 2) AS percentage_of_avg,
    GROUP_CONCAT(DISTINCT t.tag_name) AS tags,
    a.created_at
FROM articles a
JOIN users u ON a.author_id = u.user_id
LEFT JOIN article_tags at ON a.article_id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.tag_id
WHERE a.is_published = 1 
    AND a.view_count > (SELECT AVG(view_count) FROM articles WHERE is_published = 1)
GROUP BY a.article_id, a.title, a.view_count, u.username, a.created_at
ORDER BY a.view_count DESC
LIMIT 25;

-- Query 4: Date-based - Recent activity in the last 30 days
-- This query shows recent edits, comments, and new articles
SELECT 
    'Article Created' AS activity_type,
    a.article_id AS item_id,
    a.title AS item_title,
    u.username AS user,
    a.created_at AS activity_date,
    NULL AS comment_text
FROM articles a
JOIN users u ON a.author_id = u.user_id
WHERE a.created_at >= datetime('now', '-30 days')

UNION ALL

SELECT 
    'Article Edited' AS activity_type,
    r.article_id AS item_id,
    a.title AS item_title,
    u.username AS user,
    r.created_at AS activity_date,
    r.revision_comment AS comment_text
FROM revisions r
JOIN articles a ON r.article_id = a.article_id
JOIN users u ON r.editor_id = u.user_id
WHERE r.created_at >= datetime('now', '-30 days')

UNION ALL

SELECT 
    'Comment Posted' AS activity_type,
    c.article_id AS item_id,
    a.title AS item_title,
    u.username AS user,
    c.created_at AS activity_date,
    SUBSTR(c.content, 1, 50) || '...' AS comment_text
FROM comments c
JOIN articles a ON c.article_id = a.article_id
JOIN users u ON c.user_id = u.user_id
WHERE c.created_at >= datetime('now', '-30 days') AND c.is_deleted = 0

ORDER BY activity_date DESC
LIMIT 50;

-- Query 5: Article Search with Metadata
-- This query finds articles containing specific keywords and provides rich metadata
SELECT 
    a.article_id,
    a.title,
    a.slug,
    u.username AS author,
    GROUP_CONCAT(DISTINCT c.category_name) AS categories,
    GROUP_CONCAT(DISTINCT t.tag_name) AS tags,
    a.view_count,
    COUNT(DISTINCT cm.comment_id) AS comment_count,
    COUNT(DISTINCT r.revision_id) AS revision_count,
    (SELECT COUNT(*) FROM page_links WHERE source_article_id = a.article_id) AS outgoing_links,
    (SELECT COUNT(*) FROM page_links WHERE target_article_id = a.article_id) AS incoming_links,
    a.created_at,
    a.updated_at
FROM articles a
JOIN users u ON a.author_id = u.user_id
LEFT JOIN article_categories ac ON a.article_id = ac.article_id
LEFT JOIN categories c ON ac.category_id = c.category_id
LEFT JOIN article_tags at ON a.article_id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.tag_id
LEFT JOIN comments cm ON a.article_id = cm.article_id AND cm.is_deleted = 0
LEFT JOIN revisions r ON a.article_id = r.article_id
WHERE a.is_published = 1 
    AND (a.title LIKE '%science%' OR a.title LIKE '%technology%')
GROUP BY a.article_id, a.title, a.slug, u.username, a.view_count, a.created_at, a.updated_at
ORDER BY a.view_count DESC, a.updated_at DESC
LIMIT 20;

