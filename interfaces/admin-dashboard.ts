import prompts from 'prompts';
import { closeDb, getDb } from '../src/db-connection';
import { DashboardStats } from '../src/types';

const db = getDb();

const fetchStats = (): DashboardStats => {
  const stats = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS totalUsers,
         (SELECT COUNT(*) FROM users WHERE is_active = 1) AS activeUsers,
         (SELECT COUNT(*) FROM articles) AS totalArticles,
         (SELECT COUNT(*) FROM articles WHERE published = 1) AS publishedArticles,
         (SELECT COUNT(*) FROM comments) AS totalComments`
    )
    .get();
  return stats as DashboardStats;
};

const showStats = () => {
  const stats = fetchStats();
  console.table([stats]);
};

const showTopAuthors = () => {
  const rows = db
    .prepare(
      `SELECT u.display_name, COUNT(a.id) AS articles
       FROM users u
       LEFT JOIN articles a ON a.author_id = u.id
       GROUP BY u.id
       ORDER BY articles DESC
       LIMIT 5`
    )
    .all();
  console.table(rows);
};

const showBusyCategories = () => {
  const rows = db
    .prepare(
      `SELECT c.name, COUNT(ac.article_id) AS articles
       FROM categories c
       LEFT JOIN article_categories ac ON ac.category_id = c.id
       GROUP BY c.id
       ORDER BY articles DESC
       LIMIT 5`
    )
    .all();
  console.table(rows);
};

const recentComments = () => {
  const rows = db
    .prepare(
      `SELECT a.title, u.display_name, c.body, c.created_at
       FROM comments c
       JOIN users u ON u.id = c.author_id
       JOIN articles a ON a.id = c.article_id
       ORDER BY c.created_at DESC
       LIMIT 5`
    )
    .all();

  rows.forEach((row: any, idx: number) => {
    console.log(`[${idx + 1}] ${row.display_name} on ${row.title} @ ${row.created_at}`);
    console.log(row.body);
    console.log('');
  });
};

const main = async () => {
  let exit = false;
  while (!exit) {
    const { action } = await prompts({
      name: 'action',
      type: 'select',
      message: 'Admin dashboard',
      choices: [
        { title: 'Show key stats', value: 'stats' },
        { title: 'Top authors', value: 'authors' },
        { title: 'Busiest categories', value: 'categories' },
        { title: 'Recent comments', value: 'comments' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'stats':
        showStats();
        break;
      case 'authors':
        showTopAuthors();
        break;
      case 'categories':
        showBusyCategories();
        break;
      case 'comments':
        recentComments();
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
