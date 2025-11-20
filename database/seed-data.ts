// Data Generation Script for Online Wiki Database
import { faker } from '@faker-js/faker'; //faker for random data
import { getDatabase, initializeDatabase } from '../src/db-connection.js'; //db-connection for database

function generateSlug(title: string): string { 
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function generateWordCount(content: string): number {
    return content.split(/\s+/).length;
}

function seedDatabase(): void {
    console.log('Starting database seeding...');
    
    // Initialize database with schema
    initializeDatabase();
    const db = getDatabase();

    // 1. Insert User Roles
    console.log('Seeding user roles...');
    const roles = [
        { name: 'Admin', create: 1, edit: 1, delete: 1, moderate: 1, admin: 1, desc: 'Full system access' },
        { name: 'Moderator', create: 1, edit: 1, delete: 1, moderate: 1, admin: 0, desc: 'Can moderate content' },
        { name: 'Editor', create: 1, edit: 1, delete: 0, moderate: 0, admin: 0, desc: 'Can create and edit articles' },
        { name: 'Contributor', create: 1, edit: 0, delete: 0, moderate: 0, admin: 0, desc: 'Can create articles' },
        { name: 'Reader', create: 0, edit: 0, delete: 0, moderate: 0, admin: 0, desc: 'Read-only access' }
    ];

    const insertRole = db.prepare(`
        INSERT INTO user_roles (role_name, can_create_articles, can_edit_articles, can_delete_articles, can_moderate, can_admin, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const role of roles) {
        insertRole.run(role.name, role.create, role.edit, role.delete, role.moderate, role.admin, role.desc);
    }

    // 2. Insert Users
    console.log('Seeding users...');
    const insertUser = db.prepare(`
        INSERT INTO users (username, email, password_hash, role_id, bio, created_at, last_login, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const userIds: number[] = [];
    for (let i = 0; i < 60; i++) {
        const roleId = faker.number.int({ min: 1, max: 5 });
        const createdAt = faker.date.past({ years: 2 }).toISOString();
        const lastLogin = faker.date.recent({ days: 30 }).toISOString();
        
        const result = insertUser.run(
            faker.internet.userName(),
            faker.internet.email(),
            faker.string.alphanumeric(64), // Mock password hash
            roleId,
            faker.lorem.sentences(2),
            createdAt,
            lastLogin,
            faker.datatype.boolean(0.95) ? 1 : 0
        );
        userIds.push(result.lastInsertRowid as number);
    }

    // 3. Insert Categories
    console.log('Seeding categories...');
    const categoryNames = [
        'Science', 'Technology', 'History', 'Geography', 'Arts', 
        'Literature', 'Music', 'Sports', 'Politics', 'Philosophy',
        'Mathematics', 'Biology', 'Physics', 'Chemistry', 'Computer Science'
    ];

const insertCategory = db.prepare(`
  INSERT INTO categories (name, description, created_at)
  VALUES (@name, @description, @created_at)
`);

const insertArticle = db.prepare(`
  INSERT INTO articles (title, slug, summary, content, published, created_at, updated_at, author_id)
  VALUES (@title, @slug, @summary, @content, @published, @created_at, @updated_at, @author_id)
`);

const insertArticleCategory = db.prepare(`
  INSERT OR IGNORE INTO article_categories (article_id, category_id)
  VALUES (@article_id, @category_id)
`);

const insertComment = db.prepare(`
  INSERT INTO comments (article_id, author_id, body, created_at)
  VALUES (@article_id, @author_id, @body, @created_at)
`);

const randomDate = () => faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: new Date() }).toISOString();

const populate = db.transaction(() => {
  for (let i = 0; i < USERS; i++) {
    const joinDate = randomDate();
    const info = insertUser.run({
      username: `${faker.internet.userName().toLowerCase()}${randomInt(10, 9999)}`,
      email: faker.internet.email().toLowerCase(),
      display_name: faker.person.fullName(),
      bio: faker.lorem.sentences(randomInt(1, 2)),
      join_date: joinDate,
      is_active: faker.datatype.boolean() ? 1 : 0
    });

    insertRole.run({
      user_id: info.lastInsertRowid,
      role: roleOptions[randomInt(0, roleOptions.length - 1)],
      assigned_at: joinDate
    });
  }

  for (let i = 0; i < CATEGORIES; i++) {
    insertCategory.run({
      name: faker.commerce.department().toLowerCase(),
      description: faker.lorem.sentence(),
      created_at: randomDate()
    });
  }

  const userIds = (db.prepare('SELECT id FROM users').all() as Array<{ id: number }>).map((row) => row.id);
  const categoryIds = (db.prepare('SELECT id FROM categories').all() as Array<{ id: number }>).map((row) => row.id);

  for (let i = 0; i < ARTICLES; i++) {
    const title = faker.lorem.words(randomInt(3, 7));
    const slug = faker.helpers.slugify(`${title}-${faker.string.alphanumeric(4)}`).toLowerCase();
    const createdAt = randomDate();
    const updatedAt = faker.datatype.boolean() ? randomDate() : createdAt;
    const authorId = faker.helpers.arrayElement(userIds);

    const info = insertArticle.run({
      title: title.replace(/(^\\w|\\s\\w)/g, (s) => s.toUpperCase()),
      slug,
      summary: faker.lorem.sentences(randomInt(2, 4)),
      content: faker.lorem.paragraphs(randomInt(3, 5), '\\n\\n'),
      published: faker.datatype.boolean() ? 1 : 0,
      created_at: createdAt,
      updated_at: updatedAt,
      author_id: authorId
    });

    const articleId = Number(info.lastInsertRowid);
    const categorySample = faker.helpers.arrayElements(categoryIds, randomInt(1, 3));
    categorySample.forEach((categoryId) => insertArticleCategory.run({ article_id: articleId, category_id: categoryId }));
  }

  const articleIds = (db.prepare('SELECT id FROM articles').all() as Array<{ id: number }>).map((row) => row.id);

  for (let i = 0; i < COMMENTS; i++) {
    insertComment.run({
      article_id: faker.helpers.arrayElement(articleIds),
      author_id: faker.helpers.arrayElement(userIds),
      body: faker.lorem.sentences(randomInt(1, 3)),
      created_at: randomDate()
    });
  }
});

populate();
console.log('Database seeded at', dbPath);
db.close();
