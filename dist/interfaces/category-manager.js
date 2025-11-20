"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const db_connection_1 = require("../src/db-connection");
const db = (0, db_connection_1.getDb)();
const listCategories = () => {
    const rows = db
        .prepare(`SELECT c.id, c.name, COUNT(ac.article_id) AS articles
       FROM categories c
       LEFT JOIN article_categories ac ON ac.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`)
        .all();
    console.table(rows);
};
const createCategory = async () => {
    const answers = await (0, prompts_1.default)([
        { name: 'name', type: 'text', message: 'Category name' },
        { name: 'description', type: 'text', message: 'Description' }
    ]);
    if (!answers.name) {
        console.log('Creation cancelled.');
        return;
    }
    db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(answers.name, answers.description ?? null);
    console.log('Category saved.');
};
const assignCategory = async () => {
    const articles = db.prepare('SELECT id, title FROM articles ORDER BY updated_at DESC LIMIT 25').all();
    const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
    if (!articles.length || !categories.length) {
        console.log('Need both articles and categories.');
        return;
    }
    const answers = await (0, prompts_1.default)([
        {
            name: 'articleId',
            type: 'select',
            message: 'Choose article',
            choices: articles.map((a) => ({ title: a.title, value: a.id }))
        },
        {
            name: 'categoryIds',
            type: 'multiselect',
            message: 'Select categories',
            choices: categories.map((c) => ({ title: c.name, value: c.id })),
            hint: 'Space to toggle, enter to submit'
        }
    ]);
    if (!answers.articleId || !answers.categoryIds?.length) {
        console.log('No categories selected.');
        return;
    }
    const stmt = db.prepare('INSERT OR IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)');
    answers.categoryIds.forEach((id) => stmt.run(answers.articleId, id));
    console.log('Categories assigned.');
};
const removeCategory = async () => {
    const articles = db
        .prepare(`SELECT a.id, a.title, COUNT(ac.category_id) AS categories
       FROM articles a
       LEFT JOIN article_categories ac ON ac.article_id = a.id
       GROUP BY a.id
       HAVING categories > 0
       ORDER BY a.updated_at DESC`)
        .all();
    if (!articles.length) {
        console.log('No article has categories assigned.');
        return;
    }
    const { articleId } = await (0, prompts_1.default)({
        name: 'articleId',
        type: 'select',
        message: 'Select article',
        choices: articles.map((a) => ({ title: `${a.title} (${a.categories})`, value: a.id }))
    });
    if (!articleId)
        return;
    const categories = db
        .prepare(`SELECT c.id, c.name
       FROM categories c
       JOIN article_categories ac ON ac.category_id = c.id
       WHERE ac.article_id = ?`)
        .all(articleId);
    const { categoryIds } = await (0, prompts_1.default)({
        name: 'categoryIds',
        type: 'multiselect',
        message: 'Remove which categories?',
        choices: categories.map((c) => ({ title: c.name, value: c.id }))
    });
    if (!categoryIds?.length)
        return;
    const stmt = db.prepare('DELETE FROM article_categories WHERE article_id = ? AND category_id = ?');
    categoryIds.forEach((id) => stmt.run(articleId, id));
    console.log('Categories removed.');
};
const main = async () => {
    let exit = false;
    while (!exit) {
        const { action } = await (0, prompts_1.default)({
            name: 'action',
            type: 'select',
            message: 'Category manager',
            choices: [
                { title: 'List categories', value: 'list' },
                { title: 'Create category', value: 'create' },
                { title: 'Assign categories to article', value: 'assign' },
                { title: 'Remove categories from article', value: 'remove' },
                { title: 'Exit', value: 'exit' }
            ]
        });
        switch (action) {
            case 'list':
                listCategories();
                break;
            case 'create':
                await createCategory();
                break;
            case 'assign':
                await assignCategory();
                break;
            case 'remove':
                await removeCategory();
                break;
            default:
                exit = true;
                break;
        }
    }
};
main()
    .catch((err) => console.error(err))
    .finally(() => (0, db_connection_1.closeDb)());
