// Category Manager Interface
import prompts from 'prompts';
import { getDatabase } from '../src/db-connection.js';
import type { Category } from '../src/types.js';

const db = getDatabase();

function listCategories(): void {
    const categories = db.prepare(`
        SELECT c.category_id, c.category_name, c.description, 
               pc.category_name as parent_category,
               (SELECT COUNT(*) FROM article_categories WHERE category_id = c.category_id) as article_count
        FROM categories c
        LEFT JOIN categories pc ON c.parent_category_id = pc.category_id
        ORDER BY c.category_name
    `).all() as Array<Category & { parent_category: string | null, article_count: number }>;

    console.log('\n=== Categories ===');
    console.log('ID | Name | Parent | Articles | Description');
    console.log('-'.repeat(100));
    categories.forEach(cat => {
        const desc = cat.description ? cat.description.substring(0, 40) : '';
        console.log(`${cat.category_id} | ${cat.category_name} | ${cat.parent_category || 'None'} | ${cat.article_count} | ${desc}`);
    });
    console.log('');
}

async function createCategory(): Promise<void> {
    console.log('\n=== Create New Category ===');
    
    const categories = db.prepare('SELECT category_id, category_name FROM categories ORDER BY category_name').all() as Array<{ category_id: number, category_name: string }>;
    
    const response = await prompts([
        {
            type: 'text',
            name: 'name',
            message: 'Category name:',
            validate: (value: string) => value.length >= 3 ? true : 'Name must be at least 3 characters'
        },
        {
            type: 'text',
            name: 'description',
            message: 'Description (optional):',
            initial: ''
        },
        {
            type: 'select',
            name: 'parentId',
            message: 'Parent category (optional):',
            choices: [
                { title: 'None (Top-level category)', value: null },
                ...categories.map(cat => ({ title: cat.category_name, value: cat.category_id }))
            ]
        }
    ]);

    if (response.name) {
        try {
            const result = db.prepare(`
                INSERT INTO categories (category_name, description, parent_category_id, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `).run(response.name, response.description || null, response.parentId);

            console.log(`\n✓ Category created successfully! Category ID: ${result.lastInsertRowid}`);
        } catch (error: any) {
            console.error(`\n✗ Error creating category: ${error.message}`);
        }
    }
}

async function updateCategory(): Promise<void> {
    const categories = db.prepare('SELECT category_id, category_name FROM categories ORDER BY category_name').all() as Array<{ category_id: number, category_name: string }>;

    const selectResponse = await prompts({
        type: 'select',
        name: 'categoryId',
        message: 'Select category to update:',
        choices: categories.map(cat => ({ title: cat.category_name, value: cat.category_id }))
    });

    if (!selectResponse.categoryId) return;

    const category = db.prepare('SELECT * FROM categories WHERE category_id = ?').get(selectResponse.categoryId) as Category;

    console.log(`\nUpdating category: ${category.category_name}`);

    const response = await prompts([
        {
            type: 'text',
            name: 'name',
            message: 'Category name:',
            initial: category.category_name,
            validate: (value: string) => value.length >= 3 ? true : 'Name must be at least 3 characters'
        },
        {
            type: 'text',
            name: 'description',
            message: 'Description:',
            initial: category.description || ''
        },
        {
            type: 'select',
            name: 'parentId',
            message: 'Parent category:',
            initial: category.parent_category_id ? categories.findIndex(c => c.category_id === category.parent_category_id) + 1 : 0,
            choices: [
                { title: 'None (Top-level category)', value: null },
                ...categories.filter(c => c.category_id !== selectResponse.categoryId).map(cat => ({ 
                    title: cat.category_name, 
                    value: cat.category_id 
                }))
            ]
        }
    ]);

    try {
        db.prepare(`
            UPDATE categories 
            SET category_name = ?, description = ?, parent_category_id = ?
            WHERE category_id = ?
        `).run(response.name, response.description || null, response.parentId, selectResponse.categoryId);

        console.log('\n✓ Category updated successfully!');
    } catch (error: any) {
        console.error(`\n✗ Error updating category: ${error.message}`);
    }
}

async function deleteCategory(): Promise<void> {
    const categories = db.prepare(`
        SELECT c.category_id, c.category_name,
               (SELECT COUNT(*) FROM article_categories WHERE category_id = c.category_id) as article_count
        FROM categories c
        ORDER BY c.category_name
    `).all() as Array<{ category_id: number, category_name: string, article_count: number }>;

    const selectResponse = await prompts({
        type: 'select',
        name: 'categoryId',
        message: 'Select category to delete:',
        choices: categories.map(cat => ({ 
            title: `${cat.category_name} (${cat.article_count} articles)`, 
            value: cat.category_id 
        }))
    });

    if (!selectResponse.categoryId) return;

    const category = categories.find(c => c.category_id === selectResponse.categoryId);

    const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Are you sure you want to delete "${category?.category_name}"? This will remove the category from ${category?.article_count} articles.`,
        initial: false
    });

    if (confirm.value) {
        try {
            db.prepare('DELETE FROM categories WHERE category_id = ?').run(selectResponse.categoryId);
            console.log('\n✓ Category deleted successfully!');
        } catch (error: any) {
            console.error(`\n✗ Error deleting category: ${error.message}`);
        }
    }
}

async function manageArticleCategories(): Promise<void> {
    console.log('\n=== Manage Article Categories ===');

    const searchResponse = await prompts({
        type: 'text',
        name: 'search',
        message: 'Search for article by title:'
    });

    if (!searchResponse.search) return;

    const articles = db.prepare(`
        SELECT article_id, title
        FROM articles
        WHERE title LIKE ?
        ORDER BY updated_at DESC
        LIMIT 20
    `).all(`%${searchResponse.search}%`) as Array<{ article_id: number, title: string }>;

    if (articles.length === 0) {
        console.log('\n✗ No articles found.');
        return;
    }

    const articleResponse = await prompts({
        type: 'select',
        name: 'articleId',
        message: 'Select article:',
        choices: articles.map(art => ({ title: art.title, value: art.article_id }))
    });

    if (!articleResponse.articleId) return;

    // Get current categories
    const currentCategories = db.prepare(`
        SELECT c.category_id, c.category_name
        FROM categories c
        JOIN article_categories ac ON c.category_id = ac.category_id
        WHERE ac.article_id = ?
    `).all(articleResponse.articleId) as Array<{ category_id: number, category_name: string }>;

    console.log(`\nCurrent categories: ${currentCategories.map(c => c.category_name).join(', ') || 'None'}`);

    // Get all categories
    const allCategories = db.prepare('SELECT category_id, category_name FROM categories ORDER BY category_name').all() as Array<{ category_id: number, category_name: string }>;

    const categoryResponse = await prompts({
        type: 'multiselect',
        name: 'categories',
        message: 'Select categories for this article (space to select, enter to confirm):',
        choices: allCategories.map(cat => ({
            title: cat.category_name,
            value: cat.category_id,
            selected: currentCategories.some(c => c.category_id === cat.category_id)
        }))
    });

    if (categoryResponse.categories !== undefined) {
        try {
            // Remove all existing categories
            db.prepare('DELETE FROM article_categories WHERE article_id = ?').run(articleResponse.articleId);

            // Add new categories
            const insertStmt = db.prepare('INSERT INTO article_categories (article_id, category_id) VALUES (?, ?)');
            for (const categoryId of categoryResponse.categories) {
                insertStmt.run(articleResponse.articleId, categoryId);
            }

            console.log(`\n✓ Article categories updated! (${categoryResponse.categories.length} categories assigned)`);
        } catch (error: any) {
            console.error(`\n✗ Error updating article categories: ${error.message}`);
        }
    }
}

async function main(): Promise<void> {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Online Wiki - Category Manager      ║');
    console.log('╚════════════════════════════════════════╝\n');

    let running = true;
    while (running) {
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { title: 'List Categories', value: 'list' },
                { title: 'Create Category', value: 'create' },
                { title: 'Update Category', value: 'update' },
                { title: 'Delete Category', value: 'delete' },
                { title: 'Manage Article Categories', value: 'manage' },
                { title: 'Exit', value: 'exit' }
            ]
        });

        switch (response.action) {
            case 'list':
                listCategories();
                break;
            case 'create':
                await createCategory();
                break;
            case 'update':
                await updateCategory();
                break;
            case 'delete':
                await deleteCategory();
                break;
            case 'manage':
                await manageArticleCategories();
                break;
            case 'exit':
                running = false;
                console.log('\nGoodbye!\n');
                break;
        }
    }
}

main().catch(console.error);

