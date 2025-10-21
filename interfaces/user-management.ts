// User Management Interface
import prompts from 'prompts';
import { getDatabase } from '../src/db-connection.js';
import type { User, UserRole } from '../src/types.js';

const db = getDatabase();

function listUsers(): void {
    const users = db.prepare(`
        SELECT u.user_id, u.username, u.email, ur.role_name, u.is_active, u.created_at
        FROM users u
        JOIN user_roles ur ON u.role_id = ur.role_id
        ORDER BY u.user_id DESC
        LIMIT 20
    `).all() as Array<User & { role_name: string }>;

    console.log('\n=== Users List ===');
    console.log('ID | Username | Email | Role | Active | Created At');
    console.log('-'.repeat(80));
    users.forEach(user => {
        console.log(`${user.user_id} | ${user.username} | ${user.email} | ${user.role_name} | ${user.is_active ? 'Yes' : 'No'} | ${user.created_at}`);
    });
    console.log('');
}

function getUserRoles(): UserRole[] {
    return db.prepare('SELECT * FROM user_roles').all() as UserRole[];
}

async function createUser(): Promise<void> {
    const roles = getUserRoles();
    
    console.log('\n=== Create New User ===');
    const response = await prompts([
        {
            type: 'text',
            name: 'username',
            message: 'Username:',
            validate: (value: string) => value.length >= 3 ? true : 'Username must be at least 3 characters'
        },
        {
            type: 'text',
            name: 'email',
            message: 'Email:',
            validate: (value: string) => value.includes('@') ? true : 'Must be a valid email'
        },
        {
            type: 'password',
            name: 'password',
            message: 'Password:',
            validate: (value: string) => value.length >= 6 ? true : 'Password must be at least 6 characters'
        },
        {
            type: 'select',
            name: 'role_id',
            message: 'Select role:',
            choices: roles.map(role => ({ title: `${role.role_name} - ${role.description}`, value: role.role_id }))
        },
        {
            type: 'text',
            name: 'bio',
            message: 'Bio (optional):',
            initial: ''
        }
    ]);

    if (response.username && response.email && response.password) {
        try {
            // Simple hash simulation (in real app, use bcrypt)
            const passwordHash = Buffer.from(response.password).toString('base64');
            
            const result = db.prepare(`
                INSERT INTO users (username, email, password_hash, role_id, bio, created_at, is_active)
                VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
            `).run(response.username, response.email, passwordHash, response.role_id, response.bio || null);

            console.log(`\n✓ User created successfully! User ID: ${result.lastInsertRowid}`);
        } catch (error: any) {
            console.error(`\n✗ Error creating user: ${error.message}`);
        }
    }
}

async function updateUser(): Promise<void> {
    const response = await prompts({
        type: 'number',
        name: 'userId',
        message: 'Enter user ID to update:'
    });

    if (!response.userId) return;

    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(response.userId) as User | undefined;

    if (!user) {
        console.log('\n✗ User not found!');
        return;
    }

    console.log(`\nUpdating user: ${user.username} (${user.email})`);
    
    const roles = getUserRoles();
    const currentRole = roles.find(r => r.role_id === user.role_id);

    const updates = await prompts([
        {
            type: 'text',
            name: 'email',
            message: 'New email (leave empty to keep current):',
            initial: user.email
        },
        {
            type: 'select',
            name: 'role_id',
            message: 'Select role:',
            initial: roles.findIndex(r => r.role_id === user.role_id),
            choices: roles.map(role => ({ title: role.role_name, value: role.role_id }))
        },
        {
            type: 'text',
            name: 'bio',
            message: 'Bio:',
            initial: user.bio || ''
        },
        {
            type: 'toggle',
            name: 'is_active',
            message: 'Is active?',
            initial: Boolean(user.is_active),
            active: 'yes',
            inactive: 'no'
        }
    ]);

    try {
        db.prepare(`
            UPDATE users 
            SET email = ?, role_id = ?, bio = ?, is_active = ?
            WHERE user_id = ?
        `).run(updates.email, updates.role_id, updates.bio || null, updates.is_active ? 1 : 0, response.userId);

        console.log('\n✓ User updated successfully!');
    } catch (error: any) {
        console.error(`\n✗ Error updating user: ${error.message}`);
    }
}

async function deleteUser(): Promise<void> {
    const response = await prompts({
        type: 'number',
        name: 'userId',
        message: 'Enter user ID to delete:'
    });

    if (!response.userId) return;

    const user = db.prepare('SELECT username, email FROM users WHERE user_id = ?').get(response.userId) as { username: string, email: string } | undefined;

    if (!user) {
        console.log('\n✗ User not found!');
        return;
    }

    const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Are you sure you want to delete user "${user.username}" (${user.email})? This will also delete all their articles, comments, and revisions.`,
        initial: false
    });

    if (confirm.value) {
        try {
            db.prepare('DELETE FROM users WHERE user_id = ?').run(response.userId);
            console.log('\n✓ User deleted successfully!');
        } catch (error: any) {
            console.error(`\n✗ Error deleting user: ${error.message}`);
        }
    }
}

async function main(): Promise<void> {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Online Wiki - User Management       ║');
    console.log('╚════════════════════════════════════════╝\n');

    let running = true;
    while (running) {
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { title: 'List Users', value: 'list' },
                { title: 'Create User', value: 'create' },
                { title: 'Update User', value: 'update' },
                { title: 'Delete User', value: 'delete' },
                { title: 'Exit', value: 'exit' }
            ]
        });

        switch (response.action) {
            case 'list':
                listUsers();
                break;
            case 'create':
                await createUser();
                break;
            case 'update':
                await updateUser();
                break;
            case 'delete':
                await deleteUser();
                break;
            case 'exit':
                running = false;
                console.log('\nGoodbye!\n');
                break;
        }
    }
}

main().catch(console.error);

