import prompts from 'prompts';
import { closeDb, getDb } from '../src/db-connection';

const db = getDb();

const listLatest = () => {
  const rows = db
    .prepare(
      `SELECT a.id, a.title, u.display_name AS author, a.created_at, a.published
       FROM articles a
       JOIN users u ON u.id = a.author_id
       ORDER BY a.created_at DESC
       LIMIT 10`
    )
    .all();

  console.table(rows);
};

const searchArticles = async () => {
  const { keyword } = await prompts({ name: 'keyword', type: 'text', message: 'Search keyword' });
  if (!keyword) return null;

  const rows = db
    .prepare(
      `SELECT id, title FROM articles WHERE title LIKE ? OR summary LIKE ? ORDER BY updated_at DESC LIMIT 10`
    )
    .all(`%${keyword}%`, `%${keyword}%`);

  if (!rows.length) {
    console.log('No matches.');
    return null;
  }

  const { articleId } = await prompts({
    name: 'articleId',
    type: 'select',
    message: 'Select article',
    choices: rows.map((r: any) => ({ title: r.title, value: r.id }))
  });

  return articleId ?? null;
};

type ArticleRow = {
  id: number;
  title: string;
  author: string;
  published: number;
  summary: string | null;
  content: string;
};

const showArticle = (id: number) => {
  const article = db
    .prepare(
      `SELECT a.*, u.display_name AS author
       FROM articles a
       JOIN users u ON u.id = a.author_id
       WHERE a.id = ?`
    )
    .get(id) as ArticleRow | undefined;

  if (!article) {
    console.log('Article not found.');
    return;
  }

  const categories = db
    .prepare(
      `SELECT c.name FROM categories c
       JOIN article_categories ac ON ac.category_id = c.id
       WHERE ac.article_id = ?`
    )
    .all(id)
    .map((row: any) => row.name);

  console.log('\n=== Article ===');
  console.log(`Title: ${article.title}`);
  console.log(`Author: ${article.author}`);
  console.log(`Published: ${article.published ? 'yes' : 'no'}`);
  console.log(`Categories: ${categories.join(', ') || 'none'}`);
  console.log(`Summary: ${article.summary ?? 'n/a'}`);
  console.log('\nContent:\n');
  console.log(article.content);
  console.log('\n==============\n');
};

const showComments = (id: number) => {
  const comments = db
    .prepare(
      `SELECT c.body, c.created_at, u.display_name
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.article_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(id);

  if (!comments.length) {
    console.log('No comments yet.');
    return;
  }

  comments.forEach((c: any, index: number) => {
    console.log(`[${index + 1}] ${c.display_name} @ ${c.created_at}`);
    console.log(c.body);
    console.log('');
  });
};

const main = async () => {
  let exit = false;
  while (!exit) {
    const { action } = await prompts({
      name: 'action',
      type: 'select',
      message: 'Article browser',
      choices: [
        { title: 'List latest articles', value: 'latest' },
        { title: 'Search articles', value: 'search' },
        { title: 'View comments', value: 'comments' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'latest':
        listLatest();
        break;
      case 'search': {
        const articleId = await searchArticles();
        if (articleId) {
          showArticle(articleId);
        }
        break;
      }
      case 'comments': {
        const articleId = await searchArticles();
        if (articleId) {
          showComments(articleId);
        }
        break;
      }
      default:
        exit = true;
        break;
    }
  }
};

main()
  .catch((err) => console.error(err))
  .finally(() => closeDb());
