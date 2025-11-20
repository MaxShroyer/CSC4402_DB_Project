"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3")); //better-sqlite3 for database
const faker_1 = require("@faker-js/faker"); //faker for random data
const fs_1 = __importDefault(require("fs")); //fs for file system
const path_1 = __importDefault(require("path")); //path for file system
const schemaPath = path_1.default.resolve(__dirname, 'schema.sql');
const dbPath = path_1.default.resolve(__dirname, 'wiki.db'); //path to the database
const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
const db = new better_sqlite3_1.default(dbPath); //create a new database
db.pragma('journal_mode = WAL'); //set the journal mode to WAL
db.exec(schemaSql);
const USERS = 20;
const CATEGORIES = 6;
const ARTICLES = 40;
const COMMENTS = 80;
const roleOptions = ['admin', 'editor', 'viewer'];
const randomInt = (min, max) => faker_1.faker.number.int({ min, max });
const insertUser = db.prepare(`
  INSERT INTO users (username, email, display_name, bio, join_date, is_active)
  VALUES (@username, @email, @display_name, @bio, @join_date, @is_active)
`);
const insertRole = db.prepare(`
  INSERT INTO user_roles (user_id, role, assigned_at)
  VALUES (@user_id, @role, @assigned_at)
`);
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
const randomDate = () => faker_1.faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: new Date() }).toISOString();
const populate = db.transaction(() => {
    for (let i = 0; i < USERS; i++) {
        const joinDate = randomDate();
        const info = insertUser.run({
            username: `${faker_1.faker.internet.userName().toLowerCase()}${randomInt(10, 9999)}`,
            email: faker_1.faker.internet.email().toLowerCase(),
            display_name: faker_1.faker.person.fullName(),
            bio: faker_1.faker.lorem.sentences(randomInt(1, 2)),
            join_date: joinDate,
            is_active: faker_1.faker.datatype.boolean() ? 1 : 0
        });
        insertRole.run({
            user_id: info.lastInsertRowid,
            role: roleOptions[randomInt(0, roleOptions.length - 1)],
            assigned_at: joinDate
        });
    }
    for (let i = 0; i < CATEGORIES; i++) {
        insertCategory.run({
            name: faker_1.faker.commerce.department().toLowerCase(),
            description: faker_1.faker.lorem.sentence(),
            created_at: randomDate()
        });
    }
    const userIds = db.prepare('SELECT id FROM users').all().map((row) => row.id);
    const categoryIds = db.prepare('SELECT id FROM categories').all().map((row) => row.id);
    for (let i = 0; i < ARTICLES; i++) {
        const title = faker_1.faker.lorem.words(randomInt(3, 7));
        const slug = faker_1.faker.helpers.slugify(`${title}-${faker_1.faker.string.alphanumeric(4)}`).toLowerCase();
        const createdAt = randomDate();
        const updatedAt = faker_1.faker.datatype.boolean() ? randomDate() : createdAt;
        const authorId = faker_1.faker.helpers.arrayElement(userIds);
        const info = insertArticle.run({
            title: title.replace(/(^\\w|\\s\\w)/g, (s) => s.toUpperCase()),
            slug,
            summary: faker_1.faker.lorem.sentences(randomInt(2, 4)),
            content: faker_1.faker.lorem.paragraphs(randomInt(3, 5), '\\n\\n'),
            published: faker_1.faker.datatype.boolean() ? 1 : 0,
            created_at: createdAt,
            updated_at: updatedAt,
            author_id: authorId
        });
        const articleId = Number(info.lastInsertRowid);
        const categorySample = faker_1.faker.helpers.arrayElements(categoryIds, randomInt(1, 3));
        categorySample.forEach((categoryId) => insertArticleCategory.run({ article_id: articleId, category_id: categoryId }));
    }
    const articleIds = db.prepare('SELECT id FROM articles').all().map((row) => row.id);
    for (let i = 0; i < COMMENTS; i++) {
        insertComment.run({
            article_id: faker_1.faker.helpers.arrayElement(articleIds),
            author_id: faker_1.faker.helpers.arrayElement(userIds),
            body: faker_1.faker.lorem.sentences(randomInt(1, 3)),
            created_at: randomDate()
        });
    }
});
populate();
console.log('Database seeded at', dbPath);
db.close();
