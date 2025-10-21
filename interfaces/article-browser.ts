// Article Browser Interface
import prompts from 'prompts';
import { getDatabase } from '../src/db-connection.js';

const db = getDatabase();

async function browseArticles(): Promise<void> {
    const response = await prompts({
        type: 'select',
        name: 'sortBy',
        message: 'Browse articles by:',
        choices: [
            { title: 'Most Recent', value: 'recent' },
            { title: 'Most Viewed', value: 'popular' },
            { title: 'Most Edited', value: 'edited' },
            { title: 'By Category', value: 'category' },
            { title: 'By Tag', value: 'tag' },
            { title: 'Search by Title', value: 'search' }
        ]
    });

    let articles: any[] = [];
    let query = '';
    let params: any[] = [];

    switch (response.sortBy) {
        case 'recent':
            query = `
                SELECT a.article_id, a.title, a.view_count, u.username as author, 
                       a.created_at, a.updated_at,
                       (SELECT COUNT(*) FROM revisions WHERE article_id = a.article_id) as revision_count
                FROM articles a
                JOIN users u ON a.author_id = u.user_id
                WHERE a.is_published = 1
                ORDER BY a.updated_at DESC
                LIMIT 30
            `;
            articles = db.prepare(query).all();
            break;

        case 'popular':
            query = `
                SELECT a.article_id, a.title, a.view_count, u.username as author, 
                       a.created_at, a.updated_at,
                       (SELECT COUNT(*) FROM revisions WHERE article_id = a.article_id) as revision_count
                FROM articles a
                JOIN users u ON a.author_id = u.user_id
                WHERE a.is_published = 1
                ORDER BY a.view_count DESC
                LIMIT 30
            `;
            articles = db.prepare(query).all();
            break;

        case 'edited':
            query = `
                SELECT a.article_id, a.title, a.view_count, u.username as author, 
                       a.created_at, a.updated_at,
                       COUNT(r.revision_id) as revision_count
                FROM articles a
                JOIN users u ON a.author_id = u.user_id
                LEFT JOIN revisions r ON a.article_id = r.article_id
                WHERE a.is_published = 1
                GROUP BY a.article_id
                ORDER BY revision_count DESC
                LIMIT 30
            `;
            articles = db.prepare(query).all();
            break;

        case 'category':
            const categories = db.prepare('SELECT category_id, category_name FROM categories ORDER BY category_name').all() as Array<{ category_id: number, category_name: string }>;
            const catResponse = await prompts({
                type: 'select',
                name: 'categoryId',
                message: 'Select category:',
                choices: categories.map(cat => ({ title: cat.category_name, value: cat.category_id }))
            });

            if (!catResponse.categoryId) return;

            query = `
                SELECT a.article_id, a.title, a.view_count, u.username as author, 
                       a.created_at, a.updated_at,
                       (SELECT COUNT(*) FROM revisions WHERE article_id = a.article_id) as revision_count
                FROM articles a
                JOIN users u ON a.author_id = u.user_id
                JOIN article_categories ac ON a.article_id = ac.article_id
                WHERE a.is_published = 1 AND ac.category_id = ?
                ORDER BY a.updated_at DESC
                LIMIT 30
            `;
            articles = db.prepare(query).all(catResponse.categoryId);
            break;

        case 'tag':
            const tags = db.prepare('SELECT tag_id, tag_name FROM tags ORDER BY tag_name').all() as Array<{ tag_id: number, tag_name: string }>;
            const tagResponse = await prompts({
                type: 'select',
                name: 'tagId',
                message: 'Select tag:',
                choices: tags.map(tag => ({ title: tag.tag_name, value: tag.tag_id }))
            });

            if (!tagResponse.tagId) return;

            query = `
                SELECT a.article_id, a.title, a.view_count, u.username as author, 
                       a.created_at, a.updated_at,
                       (SELECT COUNT(*) FROM revisions WHERE article_id = a.article_id) as revision_count
                FROM articles a
                JOIN users u ON a.author_id = u.user_id
                JOIN article_tags at ON a.article_id = at.article_id
                WHERE a.is_published = 1 AND at.tag_id = ?
                ORDER BY a.updated_at DESC
                LIMIT 30
            `;
            articles = db.prepare(query).all(tagResponse.tagId);
            break;

        case 'search':
            const searchResponse = await prompts({
                type: 'text',
                name: 'search',
                message: 'Enter search term:'
            });

            if (!searchResponse.search) return;

            query = `
                SELECT a.article_id, a.title, a.view_count, u.username as author, 
                       a.created_at, a.updated_at,
                       (SELECT COUNT(*) FROM revisions WHERE article_id = a.article_id) as revision_count
                FROM articles a
                JOIN users u ON a.author_id = u.user_id
                WHERE a.is_published = 1 AND a.title LIKE ?
                ORDER BY a.view_count DESC
                LIMIT 30
            `;
            articles = db.prepare(query).all(`%${searchResponse.search}%`);
            break;
    }

    if (articles.length === 0) {
        console.log('\n✗ No articles found.\n');
        return;
    }

    console.log('\n=== Articles ===');
    console.log('ID | Title | Author | Views | Revisions | Updated');
    console.log('-'.repeat(100));
    articles.forEach((art: any) => {
        const titleShort = art.title.length > 40 ? art.title.substring(0, 37) + '...' : art.title;
        console.log(`${art.article_id} | ${titleShort} | ${art.author} | ${art.view_count} | ${art.revision_count} | ${art.updated_at}`);
    });

    const viewResponse = await prompts({
        type: 'number',
        name: 'articleId',
        message: '\nEnter article ID to view details (0 to skip):'
    });

    if (viewResponse.articleId && viewResponse.articleId > 0) {
        await viewArticleDetails(viewResponse.articleId);
    }
}

async function viewArticleDetails(articleId: number): Promise<void> {
    const article = db.prepare(`
        SELECT a.*, u.username as author, u.email as author_email
        FROM articles a
        JOIN users u ON a.author_id = u.user_id
        WHERE a.article_id = ?
    `).get(articleId) as any;

    if (!article) {
        console.log('\n✗ Article not found.\n');
        return;
    }

    // Get categories
    const categories = db.prepare(`
        SELECT c.category_name
        FROM categories c
        JOIN article_categories ac ON c.category_id = ac.category_id
        WHERE ac.article_id = ?
    `).all(articleId) as Array<{ category_name: string }>;

    // Get tags
    const tags = db.prepare(`
        SELECT t.tag_name
        FROM tags t
        JOIN article_tags at ON t.tag_id = at.tag_id
        WHERE at.article_id = ?
    `).all(articleId) as Array<{ tag_name: string }>;

    // Get latest revision
    const latestRevision = db.prepare(`
        SELECT r.*, u.username as editor
        FROM revisions r
        JOIN users u ON r.editor_id = u.user_id
        WHERE r.article_id = ?
        ORDER BY r.created_at DESC
        LIMIT 1
    `).get(articleId) as any;

    // Get revision history
    const revisions = db.prepare(`
        SELECT r.revision_id, r.created_at, u.username as editor, r.revision_comment, r.word_count
        FROM revisions r
        JOIN users u ON r.editor_id = u.user_id
        WHERE r.article_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
    `).all(articleId) as any[];

    // Get comments
    const comments = db.prepare(`
        SELECT c.*, u.username
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.article_id = ? AND c.is_deleted = 0
        ORDER BY c.created_at DESC
        LIMIT 10
    `).all(articleId) as any[];

    // Update view count and log view
    db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE article_id = ?').run(articleId);
    db.prepare(`
        INSERT INTO view_statistics (article_id, viewed_at)
        VALUES (?, datetime('now'))
    `).run(articleId);

    console.log('\n' + '='.repeat(100));
    console.log(`ARTICLE: ${article.title}`);
    console.log('='.repeat(100));
    console.log(`Author: ${article.author} (${article.author_email})`);
    console.log(`Created: ${article.created_at} | Updated: ${article.updated_at}`);
    console.log(`Views: ${article.view_count} | Published: ${article.is_published ? 'Yes' : 'No'} | Locked: ${article.is_locked ? 'Yes' : 'No'}`);
    console.log(`Slug: ${article.slug}`);
    console.log(`Categories: ${categories.map(c => c.category_name).join(', ') || 'None'}`);
    console.log(`Tags: ${tags.map(t => t.tag_name).join(', ') || 'None'}`);
    console.log('\n--- Latest Content ---');
    if (latestRevision) {
        console.log(`Last edited by: ${latestRevision.editor} on ${latestRevision.created_at}`);
        console.log(`Word count: ${latestRevision.word_count}`);
        console.log(`\n${latestRevision.content.substring(0, 500)}${latestRevision.content.length > 500 ? '...' : ''}`);
    }

    console.log('\n--- Revision History ---');
    revisions.forEach((rev, idx) => {
        console.log(`${idx + 1}. Rev #${rev.revision_id} - ${rev.editor} on ${rev.created_at}`);
        console.log(`   Comment: ${rev.revision_comment} | Words: ${rev.word_count}`);
    });

    console.log('\n--- Recent Comments ---');
    if (comments.length > 0) {
        comments.forEach((comment, idx) => {
            console.log(`${idx + 1}. ${comment.username} on ${comment.created_at}:`);
            console.log(`   ${comment.content.substring(0, 150)}${comment.content.length > 150 ? '...' : ''}`);
        });
    } else {
        console.log('No comments yet.');
    }
    console.log('='.repeat(100) + '\n');
}

async function main(): Promise<void> {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Online Wiki - Article Browser       ║');
    console.log('╚════════════════════════════════════════╝\n');

    let running = true;
    while (running) {
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { title: 'Browse Articles', value: 'browse' },
                { title: 'View Specific Article', value: 'view' },
                { title: 'Exit', value: 'exit' }
            ]
        });

        switch (response.action) {
            case 'browse':
                await browseArticles();
                break;
            case 'view':
                const idResponse = await prompts({
                    type: 'number',
                    name: 'articleId',
                    message: 'Enter article ID:'
                });
                if (idResponse.articleId) {
                    await viewArticleDetails(idResponse.articleId);
                }
                break;
            case 'exit':
                running = false;
                console.log('\nGoodbye!\n');
                break;
        }
    }
}

main().catch(console.error);

