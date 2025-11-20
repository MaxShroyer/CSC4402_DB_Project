import prompts, { PromptObject } from 'prompts';
import { closeDb, getDb } from '../src/db-connection';

const db = getDb();

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureSlug = (base: string) => {
  let slug = base;
  let counter = 1;
  const exists = db.prepare('SELECT 1 FROM articles WHERE slug = ?');
  while (exists.get(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
};

const selectArticle = async () => {
  const articles = db
    .prepare('SELECT id, title FROM articles ORDER BY updated_at DESC LIMIT 25')
    .all();
  if (!articles.length) {
    console.log('No articles found.');
    return null;
  }

  const { articleId } = await prompts({
    name: 'articleId',
    type: 'select',
    message: 'Choose article',
    choices: articles.map((a: any) => ({ title: a.title, value: a.id }))
  });
  return articleId ?? null;
};

const createArticle = async () => {
  const authors = db.prepare('SELECT id, display_name FROM users WHERE is_active = 1').all();
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();

  if (!authors.length) {
    console.log('Need at least one active user to create an article.');
    return;
  }

  const questions: PromptObject[] = [
    { name: 'title', type: 'text', message: 'Title' },
    { name: 'summary', type: 'text', message: 'Summary' },
    { name: 'content', type: 'text', message: 'Content' },
    {
      name: 'author_id',
      type: 'select',
      message: 'Author',
      choices: authors.map((a: any) => ({ title: a.display_name, value: a.id }))
    },
    {
      name: 'published',
      type: 'toggle',
      message: 'Publish immediately?',
      initial: true,
      active: 'yes',
      inactive: 'no'
    }
  ];

  if (categories.length) {
    questions.push({
      name: 'category_ids',
      type: 'multiselect',
      message: 'Assign categories',
      hint: 'Space to toggle, enter to submit',
      choices: categories.map((c: any) => ({ title: c.name, value: c.id }))
    });
  }

  const answers = await prompts(questions);

  if (!answers.title || !answers.content) {
    console.log('Article creation cancelled.');
    return;
  }

  const slug = ensureSlug(slugify(answers.title));
  const info = db
    .prepare(
      `INSERT INTO articles (title, slug, summary, content, published, created_at, updated_at, author_id)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)`
    )
    .run(answers.title, slug, answers.summary ?? null, answers.content, answers.published ? 1 : 0, answers.author_id);

  const articleId = Number(info.lastInsertRowid);
  const categoryIds: number[] = answers.category_ids || [];
  const stmt = db.prepare('INSERT OR IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)');
  categoryIds.forEach((id) => stmt.run(articleId, id));

  console.log('Article created with id', articleId);
};

const updateArticle = async () => {
  const articleId = await selectArticle();
  if (!articleId) return;

  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId) as any;
  const currentCategories = db
    .prepare('SELECT category_id FROM article_categories WHERE article_id = ?')
    .all(articleId)
    .map((row: any) => row.category_id);
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();

  const questions: PromptObject[] = [
    { name: 'title', type: 'text', message: 'Title', initial: article.title },
    { name: 'summary', type: 'text', message: 'Summary', initial: article.summary ?? '' },
    { name: 'content', type: 'text', message: 'Content', initial: article.content },
    {
      name: 'published',
      type: 'toggle',
      message: 'Published?',
      initial: Boolean(article.published),
      active: 'yes',
      inactive: 'no'
    }
  ];

  if (categories.length) {
    questions.push({
      name: 'category_ids',
      type: 'multiselect',
      message: 'Assign categories',
      initial: currentCategories as any,
      hint: 'Space to toggle, enter to submit',
      choices: categories.map((c: any) => ({ title: c.name, value: c.id }))
    });
  }

  const answers = await prompts(questions);

  if (!answers.title || !answers.content) {
    console.log('Update cancelled.');
    return;
  }

  db.prepare(
    `UPDATE articles
     SET title = ?, summary = ?, content = ?, published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(answers.title, answers.summary ?? null, answers.content, answers.published ? 1 : 0, articleId);

  const categoryIds: number[] = answers.category_ids || [];
  const deleteStmt = db.prepare('DELETE FROM article_categories WHERE article_id = ?');
  const insertStmt = db.prepare('INSERT OR IGNORE INTO article_categories (article_id, category_id) VALUES (?, ?)');
  deleteStmt.run(articleId);
  categoryIds.forEach((id) => insertStmt.run(articleId, id));

  console.log('Article updated.');
};

const deleteArticle = async () => {
  const articleId = await selectArticle();
  if (!articleId) return;

  const article = db.prepare('SELECT title FROM articles WHERE id = ?').get(articleId) as { title: string };
  const { confirm } = await prompts({
    name: 'confirm',
    type: 'toggle',
    message: `Delete "${article.title}"?`,
    active: 'yes',
    inactive: 'no'
  });

  if (!confirm) return;
  db.prepare('DELETE FROM articles WHERE id = ?').run(articleId);
  console.log('Article deleted.');
};

const main = async () => {
  let exit = false;
  while (!exit) {
    const { action } = await prompts({
      name: 'action',
      type: 'select',
      message: 'Article editor',
      choices: [
        { title: 'Create article', value: 'create' },
        { title: 'Update article', value: 'update' },
        { title: 'Delete article', value: 'delete' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'create':
        await createArticle();
        break;
      case 'update':
        await updateArticle();
        break;
      case 'delete':
        await deleteArticle();
        break;
      default:
        exit = true;
        break;
    }
  }
};

main()
  .catch((err) => console.error(err))
  .finally(() => closeDb());
