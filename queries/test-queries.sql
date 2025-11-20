-- Query 1: Articles grouped by category with author information
SELECT c.name AS category,
       a.title,
       u.display_name AS author,
       CASE a.published WHEN 1 THEN 'yes' ELSE 'no' END AS published,
       a.created_at
FROM articles a
JOIN users u ON u.id = a.author_id
JOIN article_categories ac ON ac.article_id = a.id
JOIN categories c ON c.id = ac.category_id
ORDER BY c.name, a.created_at DESC;

-- Query 2: Article overview with comment counts
SELECT a.title,
       u.display_name AS author,
       a.created_at,
       a.updated_at,
       COUNT(c.id) AS comment_count
FROM articles a
JOIN users u ON u.id = a.author_id
LEFT JOIN comments c ON c.article_id = a.id
GROUP BY a.id
ORDER BY comment_count DESC, a.updated_at DESC;

-- Query 3: Most active contributors
SELECT u.display_name,
       r.role,
       COUNT(a.id) AS articles_written
FROM users u
LEFT JOIN user_roles r ON r.user_id = u.id
LEFT JOIN articles a ON a.author_id = u.id
GROUP BY u.id
ORDER BY articles_written DESC
LIMIT 5;

-- Query 4: Recently commented articles
SELECT a.title,
       u.display_name AS commenter,
       c.body,
       c.created_at
FROM comments c
JOIN users u ON u.id = c.author_id
JOIN articles a ON a.id = c.article_id
ORDER BY c.created_at DESC
LIMIT 5;

-- Query 5: Category coverage report
SELECT c.name AS category,
       COUNT(ac.article_id) AS total_articles,
       ROUND(100.0 * COUNT(ac.article_id) / (SELECT COUNT(*) FROM articles), 2) AS pct_of_articles
FROM categories c
LEFT JOIN article_categories ac ON ac.category_id = c.id
GROUP BY c.id
ORDER BY total_articles DESC;
