// Data Generation Script for Online Wiki Database
import { faker } from '@faker-js/faker';
import { getDatabase, initializeDatabase } from '../src/db-connection.js';

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
        INSERT INTO categories (category_name, description, parent_category_id, created_at)
        VALUES (?, ?, ?, ?)
    `);

    const categoryIds: number[] = [];
    for (let i = 0; i < categoryNames.length; i++) {
        const parentId = i > 5 ? faker.helpers.arrayElement(categoryIds.slice(0, 5)) : null;
        const result = insertCategory.run(
            categoryNames[i],
            faker.lorem.sentence(),
            parentId,
            faker.date.past({ years: 1 }).toISOString()
        );
        categoryIds.push(result.lastInsertRowid as number);
    }

    // 4. Insert Tags
    console.log('Seeding tags...');
    const insertTag = db.prepare(`
        INSERT INTO tags (tag_name, description, created_at)
        VALUES (?, ?, ?)
    `);

    const tagIds: number[] = [];
    const tagNames = faker.helpers.uniqueArray(() => faker.word.noun(), 30);
    for (const tagName of tagNames) {
        const result = insertTag.run(
            tagName.toLowerCase(),
            faker.lorem.sentence(),
            faker.date.past({ years: 1 }).toISOString()
        );
        tagIds.push(result.lastInsertRowid as number);
    }

    // 5. Insert Articles
    console.log('Seeding articles...');
    const insertArticle = db.prepare(`
        INSERT INTO articles (title, slug, author_id, created_at, updated_at, is_published, is_locked, view_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const articleIds: number[] = [];
    for (let i = 0; i < 120; i++) {
        const title = faker.lorem.words(faker.number.int({ min: 2, max: 8 }));
        const slug = generateSlug(title) + '-' + faker.string.alphanumeric(6);
        const createdAt = faker.date.past({ years: 1 }).toISOString();
        const updatedAt = faker.date.between({ from: createdAt, to: new Date().toISOString() }).toISOString();
        
        const result = insertArticle.run(
            title,
            slug,
            faker.helpers.arrayElement(userIds),
            createdAt,
            updatedAt,
            faker.datatype.boolean(0.9) ? 1 : 0,
            faker.datatype.boolean(0.05) ? 1 : 0,
            faker.number.int({ min: 0, max: 10000 })
        );
        articleIds.push(result.lastInsertRowid as number);
    }

    // 6. Insert Revisions (multiple per article)
    console.log('Seeding revisions...');
    const insertRevision = db.prepare(`
        INSERT INTO revisions (article_id, editor_id, content, revision_comment, created_at, word_count)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const articleId of articleIds) {
        const numRevisions = faker.number.int({ min: 1, max: 8 });
        const article = db.prepare('SELECT created_at FROM articles WHERE article_id = ?').get(articleId) as { created_at: string };
        
        for (let i = 0; i < numRevisions; i++) {
            const content = faker.lorem.paragraphs(faker.number.int({ min: 3, max: 15 }));
            const wordCount = generateWordCount(content);
            const revisionDate = i === 0 
                ? article.created_at 
                : faker.date.between({ from: article.created_at, to: new Date().toISOString() }).toISOString();
            
            insertRevision.run(
                articleId,
                faker.helpers.arrayElement(userIds),
                content,
                i === 0 ? 'Initial version' : faker.lorem.sentence(),
                revisionDate,
                wordCount
            );
        }
    }

    // 7. Insert Comments
    console.log('Seeding comments...');
    const insertComment = db.prepare(`
        INSERT INTO comments (article_id, user_id, parent_comment_id, content, created_at, updated_at, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const commentIds: number[] = [];
    for (let i = 0; i < 200; i++) {
        const articleId = faker.helpers.arrayElement(articleIds);
        const createdAt = faker.date.recent({ days: 180 }).toISOString();
        const parentCommentId = commentIds.length > 0 && faker.datatype.boolean(0.3) 
            ? faker.helpers.arrayElement(commentIds) 
            : null;
        
        const result = insertComment.run(
            articleId,
            faker.helpers.arrayElement(userIds),
            parentCommentId,
            faker.lorem.sentences(faker.number.int({ min: 1, max: 4 })),
            createdAt,
            createdAt,
            faker.datatype.boolean(0.05) ? 1 : 0
        );
        commentIds.push(result.lastInsertRowid as number);
    }

    // 8. Insert Article-Category Mappings
    console.log('Seeding article-category mappings...');
    const insertArticleCategory = db.prepare(`
        INSERT OR IGNORE INTO article_categories (article_id, category_id)
        VALUES (?, ?)
    `);

    for (const articleId of articleIds) {
        const numCategories = faker.number.int({ min: 1, max: 3 });
        const selectedCategories = faker.helpers.arrayElements(categoryIds, numCategories);
        for (const categoryId of selectedCategories) {
            insertArticleCategory.run(articleId, categoryId);
        }
    }

    // 9. Insert Article-Tag Mappings
    console.log('Seeding article-tag mappings...');
    const insertArticleTag = db.prepare(`
        INSERT OR IGNORE INTO article_tags (article_id, tag_id)
        VALUES (?, ?)
    `);

    for (const articleId of articleIds) {
        const numTags = faker.number.int({ min: 2, max: 6 });
        const selectedTags = faker.helpers.arrayElements(tagIds, numTags);
        for (const tagId of selectedTags) {
            insertArticleTag.run(articleId, tagId);
        }
    }

    // 10. Insert Page Links
    console.log('Seeding page links...');
    const insertPageLink = db.prepare(`
        INSERT OR IGNORE INTO page_links (source_article_id, target_article_id, created_at)
        VALUES (?, ?, ?)
    `);

    for (let i = 0; i < 250; i++) {
        const sourceId = faker.helpers.arrayElement(articleIds);
        let targetId = faker.helpers.arrayElement(articleIds);
        
        // Ensure source and target are different
        while (targetId === sourceId) {
            targetId = faker.helpers.arrayElement(articleIds);
        }
        
        insertPageLink.run(sourceId, targetId, faker.date.recent({ days: 90 }).toISOString());
    }

    // 11. Insert Media
    console.log('Seeding media...');
    const insertMedia = db.prepare(`
        INSERT INTO media (article_id, uploader_id, filename, file_type, file_size, file_path, alt_text, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fileTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];
    for (let i = 0; i < 180; i++) {
        const fileType = faker.helpers.arrayElement(fileTypes);
        const extension = fileType.split('/')[1];
        const filename = faker.system.fileName() + '.' + extension;
        
        insertMedia.run(
            faker.helpers.arrayElement(articleIds),
            faker.helpers.arrayElement(userIds),
            filename,
            fileType,
            faker.number.int({ min: 10000, max: 5000000 }),
            '/uploads/' + faker.date.past().getFullYear() + '/' + filename,
            faker.lorem.sentence(),
            faker.date.past({ years: 1 }).toISOString()
        );
    }

    // 12. Insert View Statistics
    console.log('Seeding view statistics...');
    const insertViewStat = db.prepare(`
        INSERT INTO view_statistics (article_id, user_id, viewed_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < 5000; i++) {
        insertViewStat.run(
            faker.helpers.arrayElement(articleIds),
            faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(userIds) : null,
            faker.date.recent({ days: 90 }).toISOString(),
            faker.internet.ipv4(),
            faker.internet.userAgent()
        );
    }

    console.log('\n=== Database Seeding Complete ===');
    console.log(`Users: 60`);
    console.log(`Categories: ${categoryNames.length}`);
    console.log(`Tags: 30`);
    console.log(`Articles: 120`);
    console.log(`Revisions: ~400-600`);
    console.log(`Comments: 200`);
    console.log(`Media: 180`);
    console.log(`View Statistics: 5000`);
    console.log(`Page Links: ~250`);
    console.log('===================================\n');
}

// Run the seeding function
seedDatabase();

