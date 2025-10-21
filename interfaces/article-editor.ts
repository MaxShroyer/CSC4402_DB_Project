// Article Editor Interface
import prompts from 'prompts';
import { getDatabase } from '../src/db-connection.js';
import type { Article } from '../src/types.js';

const db = getDatabase();

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + '-' + Date.now().toString(36);
}

function getWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
}

async function selectUser(): Promise<number | null> {
    const users = db.prepare(`
        SELECT user_id, username, email 
        FROM users 
        WHERE is_active = 1 
        ORDER BY username 
        LIMIT 50
    `).all() as Array<{ user_id: number, username: string, email: string }>;

    const response = await prompts({
        type: 'autocomplete',
        name: 'userId',
        message: 'Select user:',
        choices: users.map(user => ({
            title: `${user.username} (${user.email})`,
            value: user.user_id
        }))
    });

    return response.userId || null;
}

async function selectCategories(): Promise<number[]> {
    const categories = db.prepare('SELECT category_id, category_name, description FROM categories ORDER BY category_name').all() as Array<{ category_id: number, category_name: string, description: string | null }>;

    const response = await prompts({
        type: 'multiselect',
        name: 'categories',
        message: 'Select categories (space to select, enter to confirm):',
        choices: categories.map(cat => ({
            title: `${cat.category_name}${cat.description ? ' - ' + cat.description : ''}`,
            value: cat.category_id
        })),
        min: 1
    });

    return response.categories || [];
}

async function selectTags(): Promise<number[]> {
    const tags = db.prepare('SELECT tag_id, tag_name FROM tags ORDER BY tag_name').all() as Array<{ tag_id: number, tag_name: string }>;

    const response = await prompts({
        type: 'multiselect',
        name: 'tags',
        message: 'Select tags (space to select, enter to confirm):',
        choices: tags.map(tag => ({
            title: tag.tag_name,
            value: tag.tag_id
        }))
    });

    return response.tags || [];
}

async function createArticle(): Promise<void> {
    console.log('\n=== Create New Article ===');

    const userId = await selectUser();
    if (!userId) {
        console.log('\n✗ User selection cancelled.');
        return;
    }

    const response = await prompts([
        {
            type: 'text',
            name: 'title',
            message: 'Article title:',
            validate: (value: string) => value.length >= 5 ? true : 'Title must be at least 5 characters'
        },
        {
            type: 'text',
            name: 'content',
            message: 'Article content:',
            validate: (value: string) => value.length >= 50 ? true : 'Content must be at least 50 characters'
        },
        {
            type: 'text',
            name: 'revisionComment',
            message: 'Revision comment:',
            initial: 'Initial version'
        },
        {
            type: 'toggle',
            name: 'isPublished',
            message: 'Publish immediately?',
            initial: true,
            active: 'yes',
            inactive: 'no'
        }
    ]);

    if (!response.title || !response.content) return;

    const categories = await selectCategories();
    const tags = await selectTags();

    try {
        const slug = generateSlug(response.title);
        
        // Insert article
        const articleResult = db.prepare(`
            INSERT INTO articles (title, slug, author_id, created_at, updated_at, is_published, view_count)
            VALUES (?, ?, ?, datetime('now'), datetime('now'), ?, 0)
        `).run(response.title, slug, userId, response.isPublished ? 1 : 0);

        const articleId = articleResult.lastInsertRowid as number;

        // Insert initial revision
        const wordCount = getWordCount(response.content);
        db.prepare(`
            INSERT INTO revisions (article_id, editor_id, content, revision_comment, created_at, word_count)
            VALUES (?, ?, ?, ?, datetime('now'), ?)
        `).run(articleId, userId, response.content, response.revisionComment, wordCount);

        // Insert category mappings
        const categoryStmt = db.prepare('INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)');
        for (const categoryId of categories) {
            categoryStmt.run(articleId, categoryId);
        }

        // Insert tag mappings
        const tagStmt = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');
        for (const tagId of tags) {
            tagStmt.run(articleId, tagId);
        }

        console.log(`\n✓ Article created successfully!`);
        console.log(`  Article ID: ${articleId}`);
        console.log(`  Slug: ${slug}`);
        console.log(`  Word count: ${wordCount}`);
        console.log(`  Categories: ${categories.length}`);
        console.log(`  Tags: ${tags.length}\n`);
    } catch (error: any) {
        console.error(`\n✗ Error creating article: ${error.message}`);
    }
}

async function editArticle(): Promise<void> {
    console.log('\n=== Edit Article ===');

    const searchResponse = await prompts({
        type: 'text',
        name: 'search',
        message: 'Search for article by title:'
    });

    if (!searchResponse.search) return;

    const articles = db.prepare(`
        SELECT a.article_id, a.title, a.slug, u.username as author, a.is_published
        FROM articles a
        JOIN users u ON a.author_id = u.user_id
        WHERE a.title LIKE ?
        ORDER BY a.updated_at DESC
        LIMIT 20
    `).all(`%${searchResponse.search}%`) as Array<{ article_id: number, title: string, slug: string, author: string, is_published: number }>;

    if (articles.length === 0) {
        console.log('\n✗ No articles found.');
        return;
    }

    const selectResponse = await prompts({
        type: 'select',
        name: 'articleId',
        message: 'Select article to edit:',
        choices: articles.map(art => ({
            title: `${art.title} (by ${art.author}) ${art.is_published ? '[Published]' : '[Draft]'}`,
            value: art.article_id
        }))
    });

    if (!selectResponse.articleId) return;

    const article = db.prepare('SELECT * FROM articles WHERE article_id = ?').get(selectResponse.articleId) as Article;
    const latestRevision = db.prepare(`
        SELECT content FROM revisions 
        WHERE article_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
    `).get(selectResponse.articleId) as { content: string };

    console.log(`\nCurrent title: ${article.title}`);
    console.log(`Current content preview: ${latestRevision.content.substring(0, 100)}...`);

    const userId = await selectUser();
    if (!userId) return;

    const editResponse = await prompts([
        {
            type: 'text',
            name: 'title',
            message: 'New title (leave empty to keep current):',
            initial: article.title
        },
        {
            type: 'text',
            name: 'content',
            message: 'New content:',
            validate: (value: string) => value.length >= 50 ? true : 'Content must be at least 50 characters'
        },
        {
            type: 'text',
            name: 'revisionComment',
            message: 'Revision comment:',
            validate: (value: string) => value.length > 0 ? true : 'Revision comment is required'
        }
    ]);

    if (!editResponse.content || !editResponse.revisionComment) return;

    try {
        // Update article
        const newSlug = editResponse.title !== article.title ? generateSlug(editResponse.title) : article.slug;
        db.prepare(`
            UPDATE articles 
            SET title = ?, slug = ?, updated_at = datetime('now')
            WHERE article_id = ?
        `).run(editResponse.title, newSlug, selectResponse.articleId);

        // Insert new revision
        const wordCount = getWordCount(editResponse.content);
        db.prepare(`
            INSERT INTO revisions (article_id, editor_id, content, revision_comment, created_at, word_count)
            VALUES (?, ?, ?, ?, datetime('now'), ?)
        `).run(selectResponse.articleId, userId, editResponse.content, editResponse.revisionComment, wordCount);

        console.log(`\n✓ Article updated successfully!`);
        console.log(`  New word count: ${wordCount}\n`);
    } catch (error: any) {
        console.error(`\n✗ Error editing article: ${error.message}`);
    }
}

async function deleteArticle(): Promise<void> {
    console.log('\n=== Delete Article ===');

    const searchResponse = await prompts({
        type: 'text',
        name: 'search',
        message: 'Search for article by title:'
    });

    if (!searchResponse.search) return;

    const articles = db.prepare(`
        SELECT a.article_id, a.title, a.slug, u.username as author
        FROM articles a
        JOIN users u ON a.author_id = u.user_id
        WHERE a.title LIKE ?
        ORDER BY a.updated_at DESC
        LIMIT 20
    `).all(`%${searchResponse.search}%`) as Array<{ article_id: number, title: string, slug: string, author: string }>;

    if (articles.length === 0) {
        console.log('\n✗ No articles found.');
        return;
    }

    const selectResponse = await prompts({
        type: 'select',
        name: 'articleId',
        message: 'Select article to delete:',
        choices: articles.map(art => ({
            title: `${art.title} (by ${art.author})`,
            value: art.article_id
        }))
    });

    if (!selectResponse.articleId) return;

    const article = articles.find(a => a.article_id === selectResponse.articleId);

    const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Are you sure you want to delete "${article?.title}"? This will also delete all revisions, comments, and associated data.`,
        initial: false
    });

    if (confirm.value) {
        try {
            db.prepare('DELETE FROM articles WHERE article_id = ?').run(selectResponse.articleId);
            console.log('\n✓ Article deleted successfully!\n');
        } catch (error: any) {
            console.error(`\n✗ Error deleting article: ${error.message}`);
        }
    }
}

async function main(): Promise<void> {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Online Wiki - Article Editor        ║');
    console.log('╚════════════════════════════════════════╝\n');

    let running = true;
    while (running) {
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { title: 'Create Article', value: 'create' },
                { title: 'Edit Article', value: 'edit' },
                { title: 'Delete Article', value: 'delete' },
                { title: 'Exit', value: 'exit' }
            ]
        });

        switch (response.action) {
            case 'create':
                await createArticle();
                break;
            case 'edit':
                await editArticle();
                break;
            case 'delete':
                await deleteArticle();
                break;
            case 'exit':
                running = false;
                console.log('\nGoodbye!\n');
                break;
        }
    }
}

main().catch(console.error);

