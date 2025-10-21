// Admin Dashboard Interface
import prompts from 'prompts';
import { getDatabase } from '../src/db-connection.js';

const db = getDatabase();

function showDatabaseStatistics(): void {
    console.log('\n=== Database Statistics ===\n');

    // User statistics
    const userStats = db.prepare(`
        SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-30 days') THEN user_id END) as new_users_30d
        FROM users
    `).get() as any;

    console.log('👥 Users:');
    console.log(`   Total: ${userStats.total_users}`);
    console.log(`   Active: ${userStats.active_users}`);
    console.log(`   New (last 30 days): ${userStats.new_users_30d}`);

    // Article statistics
    const articleStats = db.prepare(`
        SELECT 
            COUNT(*) as total_articles,
            SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_articles,
            SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) as locked_articles,
            SUM(view_count) as total_views,
            AVG(view_count) as avg_views
        FROM articles
    `).get() as any;

    console.log('\n📄 Articles:');
    console.log(`   Total: ${articleStats.total_articles}`);
    console.log(`   Published: ${articleStats.published_articles}`);
    console.log(`   Locked: ${articleStats.locked_articles}`);
    console.log(`   Total Views: ${articleStats.total_views}`);
    console.log(`   Average Views: ${Math.round(articleStats.avg_views)}`);

    // Revision statistics
    const revisionStats = db.prepare(`
        SELECT 
            COUNT(*) as total_revisions,
            COUNT(DISTINCT article_id) as articles_with_revisions,
            AVG(word_count) as avg_word_count,
            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-7 days') THEN revision_id END) as revisions_7d
        FROM revisions
    `).get() as any;

    console.log('\n📝 Revisions:');
    console.log(`   Total: ${revisionStats.total_revisions}`);
    console.log(`   Articles with revisions: ${revisionStats.articles_with_revisions}`);
    console.log(`   Average word count: ${Math.round(revisionStats.avg_word_count)}`);
    console.log(`   Revisions (last 7 days): ${revisionStats.revisions_7d}`);

    // Comment statistics
    const commentStats = db.prepare(`
        SELECT 
            COUNT(*) as total_comments,
            SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active_comments,
            COUNT(DISTINCT user_id) as unique_commenters
        FROM comments
    `).get() as any;

    console.log('\n💬 Comments:');
    console.log(`   Total: ${commentStats.total_comments}`);
    console.log(`   Active: ${commentStats.active_comments}`);
    console.log(`   Unique commenters: ${commentStats.unique_commenters}`);

    // Category and Tag statistics
    const taxonomyStats = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM categories) as total_categories,
            (SELECT COUNT(*) FROM tags) as total_tags,
            (SELECT COUNT(*) FROM article_categories) as article_category_mappings,
            (SELECT COUNT(*) FROM article_tags) as article_tag_mappings
    `).get() as any;

    console.log('\n🏷️  Taxonomy:');
    console.log(`   Categories: ${taxonomyStats.total_categories}`);
    console.log(`   Tags: ${taxonomyStats.total_tags}`);
    console.log(`   Article-Category mappings: ${taxonomyStats.article_category_mappings}`);
    console.log(`   Article-Tag mappings: ${taxonomyStats.article_tag_mappings}`);

    // Media and Links
    const mediaStats = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM media) as total_media,
            (SELECT COUNT(*) FROM page_links) as total_links,
            (SELECT COUNT(*) FROM view_statistics) as total_page_views
    `).get() as any;

    console.log('\n📊 Other:');
    console.log(`   Media files: ${mediaStats.total_media}`);
    console.log(`   Page links: ${mediaStats.total_links}`);
    console.log(`   Recorded page views: ${mediaStats.total_page_views}`);
    console.log('');
}

function showTopContributors(): void {
    console.log('\n=== Top Contributors ===\n');

    const contributors = db.prepare(`
        SELECT 
            u.username,
            u.email,
            ur.role_name,
            COUNT(DISTINCT a.article_id) as articles_created,
            COUNT(DISTINCT r.revision_id) as total_edits,
            COUNT(DISTINCT c.comment_id) as comments_posted
        FROM users u
        JOIN user_roles ur ON u.role_id = ur.role_id
        LEFT JOIN articles a ON u.user_id = a.author_id
        LEFT JOIN revisions r ON u.user_id = r.editor_id
        LEFT JOIN comments c ON u.user_id = c.user_id
        WHERE u.is_active = 1
        GROUP BY u.user_id
        HAVING total_edits > 0
        ORDER BY total_edits DESC
        LIMIT 15
    `).all() as any[];

    console.log('Username | Role | Articles | Edits | Comments');
    console.log('-'.repeat(80));
    contributors.forEach(user => {
        console.log(`${user.username.padEnd(20)} | ${user.role_name.padEnd(12)} | ${String(user.articles_created).padStart(8)} | ${String(user.total_edits).padStart(5)} | ${String(user.comments_posted).padStart(8)}`);
    });
    console.log('');
}

function showPopularArticles(): void {
    console.log('\n=== Most Popular Articles ===\n');

    const articles = db.prepare(`
        SELECT 
            a.article_id,
            a.title,
            u.username as author,
            a.view_count,
            COUNT(DISTINCT r.revision_id) as revisions,
            COUNT(DISTINCT c.comment_id) as comments,
            a.updated_at
        FROM articles a
        JOIN users u ON a.author_id = u.user_id
        LEFT JOIN revisions r ON a.article_id = r.article_id
        LEFT JOIN comments c ON a.article_id = c.article_id
        WHERE a.is_published = 1
        GROUP BY a.article_id
        ORDER BY a.view_count DESC
        LIMIT 15
    `).all() as any[];

    console.log('ID | Title | Author | Views | Revisions | Comments');
    console.log('-'.repeat(100));
    articles.forEach(art => {
        const titleShort = art.title.length > 35 ? art.title.substring(0, 32) + '...' : art.title;
        console.log(`${String(art.article_id).padStart(4)} | ${titleShort.padEnd(35)} | ${art.author.padEnd(15)} | ${String(art.view_count).padStart(5)} | ${String(art.revisions).padStart(9)} | ${String(art.comments).padStart(8)}`);
    });
    console.log('');
}

function showRecentActivity(): void {
    console.log('\n=== Recent Activity (Last 7 Days) ===\n');

    const activities = db.prepare(`
        SELECT 
            'Article' as type,
            a.title as item,
            u.username as user,
            a.created_at as date
        FROM articles a
        JOIN users u ON a.author_id = u.user_id
        WHERE a.created_at >= datetime('now', '-7 days')

        UNION ALL

        SELECT 
            'Edit' as type,
            a.title as item,
            u.username as user,
            r.created_at as date
        FROM revisions r
        JOIN articles a ON r.article_id = a.article_id
        JOIN users u ON r.editor_id = u.user_id
        WHERE r.created_at >= datetime('now', '-7 days')

        UNION ALL

        SELECT 
            'Comment' as type,
            a.title as item,
            u.username as user,
            c.created_at as date
        FROM comments c
        JOIN articles a ON c.article_id = a.article_id
        JOIN users u ON c.user_id = u.user_id
        WHERE c.created_at >= datetime('now', '-7 days')

        ORDER BY date DESC
        LIMIT 30
    `).all() as any[];

    console.log('Type | Item | User | Date');
    console.log('-'.repeat(100));
    activities.forEach(act => {
        const itemShort = act.item.length > 40 ? act.item.substring(0, 37) + '...' : act.item;
        console.log(`${act.type.padEnd(8)} | ${itemShort.padEnd(40)} | ${act.user.padEnd(20)} | ${act.date}`);
    });
    console.log('');
}

function showCategoryDistribution(): void {
    console.log('\n=== Category Distribution ===\n');

    const categories = db.prepare(`
        SELECT 
            c.category_name,
            COUNT(ac.article_id) as article_count,
            ROUND(COUNT(ac.article_id) * 100.0 / (SELECT COUNT(*) FROM article_categories), 2) as percentage
        FROM categories c
        LEFT JOIN article_categories ac ON c.category_id = ac.category_id
        GROUP BY c.category_id
        ORDER BY article_count DESC
        LIMIT 15
    `).all() as any[];

    console.log('Category | Articles | Percentage');
    console.log('-'.repeat(60));
    categories.forEach(cat => {
        const bar = '█'.repeat(Math.round(cat.percentage / 2));
        console.log(`${cat.category_name.padEnd(25)} | ${String(cat.article_count).padStart(8)} | ${String(cat.percentage).padStart(6)}% ${bar}`);
    });
    console.log('');
}

async function manageContent(): Promise<void> {
    console.log('\n=== Content Management ===');

    const action = await prompts({
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            { title: 'Lock/Unlock Article', value: 'lock' },
            { title: 'Publish/Unpublish Article', value: 'publish' },
            { title: 'Delete Comment', value: 'deleteComment' },
            { title: 'Deactivate User', value: 'deactivateUser' },
            { title: 'Back', value: 'back' }
        ]
    });

    switch (action.action) {
        case 'lock':
            await toggleArticleLock();
            break;
        case 'publish':
            await toggleArticlePublish();
            break;
        case 'deleteComment':
            await deleteComment();
            break;
        case 'deactivateUser':
            await toggleUserActive();
            break;
    }
}

async function toggleArticleLock(): Promise<void> {
    const searchResponse = await prompts({
        type: 'text',
        name: 'search',
        message: 'Search article by title:'
    });

    if (!searchResponse.search) return;

    const articles = db.prepare(`
        SELECT article_id, title, is_locked
        FROM articles
        WHERE title LIKE ?
        LIMIT 20
    `).all(`%${searchResponse.search}%`) as any[];

    if (articles.length === 0) {
        console.log('\n✗ No articles found.');
        return;
    }

    const selectResponse = await prompts({
        type: 'select',
        name: 'articleId',
        message: 'Select article:',
        choices: articles.map(art => ({
            title: `${art.title} ${art.is_locked ? '[LOCKED]' : '[UNLOCKED]'}`,
            value: art.article_id
        }))
    });

    if (!selectResponse.articleId) return;

    const article = articles.find(a => a.article_id === selectResponse.articleId);
    const newStatus = article.is_locked ? 0 : 1;

    db.prepare('UPDATE articles SET is_locked = ? WHERE article_id = ?').run(newStatus, selectResponse.articleId);
    console.log(`\n✓ Article ${newStatus ? 'locked' : 'unlocked'} successfully!`);
}

async function toggleArticlePublish(): Promise<void> {
    const searchResponse = await prompts({
        type: 'text',
        name: 'search',
        message: 'Search article by title:'
    });

    if (!searchResponse.search) return;

    const articles = db.prepare(`
        SELECT article_id, title, is_published
        FROM articles
        WHERE title LIKE ?
        LIMIT 20
    `).all(`%${searchResponse.search}%`) as any[];

    if (articles.length === 0) {
        console.log('\n✗ No articles found.');
        return;
    }

    const selectResponse = await prompts({
        type: 'select',
        name: 'articleId',
        message: 'Select article:',
        choices: articles.map(art => ({
            title: `${art.title} ${art.is_published ? '[PUBLISHED]' : '[DRAFT]'}`,
            value: art.article_id
        }))
    });

    if (!selectResponse.articleId) return;

    const article = articles.find(a => a.article_id === selectResponse.articleId);
    const newStatus = article.is_published ? 0 : 1;

    db.prepare('UPDATE articles SET is_published = ? WHERE article_id = ?').run(newStatus, selectResponse.articleId);
    console.log(`\n✓ Article ${newStatus ? 'published' : 'unpublished'} successfully!`);
}

async function deleteComment(): Promise<void> {
    const articles = db.prepare(`
        SELECT a.article_id, a.title, COUNT(c.comment_id) as comment_count
        FROM articles a
        JOIN comments c ON a.article_id = c.article_id
        WHERE c.is_deleted = 0
        GROUP BY a.article_id
        ORDER BY a.updated_at DESC
        LIMIT 20
    `).all() as any[];

    const articleResponse = await prompts({
        type: 'select',
        name: 'articleId',
        message: 'Select article:',
        choices: articles.map(art => ({
            title: `${art.title} (${art.comment_count} comments)`,
            value: art.article_id
        }))
    });

    if (!articleResponse.articleId) return;

    const comments = db.prepare(`
        SELECT c.comment_id, c.content, u.username, c.created_at
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.article_id = ? AND c.is_deleted = 0
        ORDER BY c.created_at DESC
    `).all(articleResponse.articleId) as any[];

    const commentResponse = await prompts({
        type: 'select',
        name: 'commentId',
        message: 'Select comment to delete:',
        choices: comments.map(com => ({
            title: `${com.username}: ${com.content.substring(0, 60)}... (${com.created_at})`,
            value: com.comment_id
        }))
    });

    if (!commentResponse.commentId) return;

    const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Mark this comment as deleted?',
        initial: false
    });

    if (confirm.value) {
        db.prepare('UPDATE comments SET is_deleted = 1 WHERE comment_id = ?').run(commentResponse.commentId);
        console.log('\n✓ Comment marked as deleted!');
    }
}

async function toggleUserActive(): Promise<void> {
    const users = db.prepare(`
        SELECT user_id, username, email, is_active
        FROM users
        ORDER BY username
        LIMIT 50
    `).all() as any[];

    const selectResponse = await prompts({
        type: 'select',
        name: 'userId',
        message: 'Select user:',
        choices: users.map(user => ({
            title: `${user.username} (${user.email}) ${user.is_active ? '[ACTIVE]' : '[INACTIVE]'}`,
            value: user.user_id
        }))
    });

    if (!selectResponse.userId) return;

    const user = users.find(u => u.user_id === selectResponse.userId);
    const newStatus = user.is_active ? 0 : 1;

    const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: `${newStatus ? 'Activate' : 'Deactivate'} user ${user.username}?`,
        initial: false
    });

    if (confirm.value) {
        db.prepare('UPDATE users SET is_active = ? WHERE user_id = ?').run(newStatus, selectResponse.userId);
        console.log(`\n✓ User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    }
}

async function main(): Promise<void> {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Online Wiki - Admin Dashboard       ║');
    console.log('╚════════════════════════════════════════╝\n');

    let running = true;
    while (running) {
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to view?',
            choices: [
                { title: 'Database Statistics', value: 'stats' },
                { title: 'Top Contributors', value: 'contributors' },
                { title: 'Popular Articles', value: 'popular' },
                { title: 'Recent Activity', value: 'activity' },
                { title: 'Category Distribution', value: 'categories' },
                { title: 'Manage Content', value: 'manage' },
                { title: 'Exit', value: 'exit' }
            ]
        });

        switch (response.action) {
            case 'stats':
                showDatabaseStatistics();
                break;
            case 'contributors':
                showTopContributors();
                break;
            case 'popular':
                showPopularArticles();
                break;
            case 'activity':
                showRecentActivity();
                break;
            case 'categories':
                showCategoryDistribution();
                break;
            case 'manage':
                await manageContent();
                break;
            case 'exit':
                running = false;
                console.log('\nGoodbye!\n');
                break;
        }
    }
}

main().catch(console.error);

