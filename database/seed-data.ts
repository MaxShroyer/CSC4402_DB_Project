// Data Generation Script for Online Wiki Database
import { faker } from '@faker-js/faker'; //faker for random data
import { getDb, closeDb } from '../src/db-connection.js'; //db-connection for database
import { readFileSync } from 'fs';
import { join } from 'path';

// Constants for seeding
const NUM_USERS = 60;
const NUM_CATEGORIES = 15;
const NUM_ARTICLES = 120;
const NUM_COMMENTS = 200;
const ROLE_OPTIONS = ['admin', 'editor', 'viewer'] as const;

// Helper functions
const randomInt = (min: number, max: number): number => {
  return faker.number.int({ min, max });
};

const randomDate = (): string => {
  return faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: new Date() }).toISOString();
};

function seedDatabase(): void {
  console.log('Starting database seeding...');
  
  // Initialize database with schema
  const db = getDb();
  // Resolve schema path - works for both ts-node and compiled versions
  const schemaPath = join(process.cwd(), 'database', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema initialized.');

  // Prepare statements
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, display_name, bio, join_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertRole = db.prepare(`
    INSERT INTO user_roles (user_id, role, assigned_at)
    VALUES (?, ?, ?)
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, description, created_at)
    VALUES (?, ?, ?)
  `);

  const insertArticle = db.prepare(`
    INSERT INTO articles (title, slug, summary, content, published, created_at, updated_at, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertArticleCategory = db.prepare(`
    INSERT OR IGNORE INTO article_categories (article_id, category_id)
    VALUES (?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (article_id, author_id, body, created_at)
    VALUES (?, ?, ?, ?)
  `);

  // Seed data in a transaction
  const populate = db.transaction(() => {
    // 1. Insert Users and Roles
    console.log('Seeding users...');
    const userIds: number[] = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const joinDate = randomDate();
      const username = `${faker.internet.userName().toLowerCase()}${randomInt(10, 9999)}`;
      const email = faker.internet.email().toLowerCase();
      
      const userInfo = insertUser.run(
        username,
        email,
        faker.person.fullName(),
        faker.lorem.sentences(randomInt(1, 2)),
        joinDate,
        faker.datatype.boolean() ? 1 : 0
      );

      const userId = Number(userInfo.lastInsertRowid);
      userIds.push(userId);

      // Assign role
      const role = ROLE_OPTIONS[randomInt(0, ROLE_OPTIONS.length - 1)];
      insertRole.run(userId, role, joinDate);
    }

    // 2. Insert Categories
    console.log('Seeding categories...');
    const categoryNames = [
      'Science', 'Technology', 'History', 'Geography', 'Arts', 
      'Literature', 'Music', 'Sports', 'Politics', 'Philosophy',
      'Mathematics', 'Biology', 'Physics', 'Chemistry', 'Computer Science'
    ];
    
    const categoryIds: number[] = [];
    for (let i = 0; i < NUM_CATEGORIES; i++) {
      const name = categoryNames[i] || faker.commerce.department().toLowerCase();
      const categoryInfo = insertCategory.run(
        name,
        faker.lorem.sentence(),
        randomDate()
      );
      categoryIds.push(Number(categoryInfo.lastInsertRowid));
    }

    // 3. Insert Articles
    console.log('Seeding articles...');
    const articleIds: number[] = [];
    for (let i = 0; i < NUM_ARTICLES; i++) {
      const title = faker.lorem.words(randomInt(3, 7));
      const slug = faker.helpers.slugify(`${title}-${faker.string.alphanumeric(4)}`).toLowerCase();
      const createdAt = randomDate();
      const updatedAt = faker.datatype.boolean() ? randomDate() : createdAt;
      const authorId = faker.helpers.arrayElement(userIds);

      const articleInfo = insertArticle.run(
        title.replace(/(^\w|\s\w)/g, (s) => s.toUpperCase()),
        slug,
        faker.lorem.sentences(randomInt(2, 4)),
        faker.lorem.paragraphs(randomInt(3, 5), '\n\n'),
        faker.datatype.boolean() ? 1 : 0,
        createdAt,
        updatedAt,
        authorId
      );

      const articleId = Number(articleInfo.lastInsertRowid);
      articleIds.push(articleId);

      // Assign categories
      const categorySample = faker.helpers.arrayElements(categoryIds, randomInt(1, 3));
      categorySample.forEach((categoryId) => {
        insertArticleCategory.run(articleId, categoryId);
      });
    }

    // 4. Insert Comments
    console.log('Seeding comments...');
    for (let i = 0; i < NUM_COMMENTS; i++) {
      insertComment.run(
        faker.helpers.arrayElement(articleIds),
        faker.helpers.arrayElement(userIds),
        faker.lorem.sentences(randomInt(1, 3)),
        randomDate()
      );
    }
  });

  populate();
  console.log('Database seeded successfully!');
  closeDb();
}

// Run seeding
seedDatabase();
