import prompts from 'prompts';
import { closeDb, getDb } from '../src/db-connection';
import { RoleType } from '../src/types';

const db = getDb();

const listUsers = () => {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.display_name, u.is_active, r.role
       FROM users u
       LEFT JOIN user_roles r ON r.user_id = u.id
       ORDER BY u.join_date DESC`
    )
    .all();

  console.table(rows);
};

const createUser = async () => {
  const answers = await prompts([
    { name: 'username', message: 'Username', type: 'text' },
    { name: 'email', message: 'Email', type: 'text' },
    { name: 'display_name', message: 'Display name', type: 'text' },
    { name: 'bio', message: 'Bio (optional)', type: 'text' },
    {
      name: 'role',
      message: 'Role',
      type: 'select',
      choices: [
        { title: 'Admin', value: 'admin' },
        { title: 'Editor', value: 'editor' },
        { title: 'Viewer', value: 'viewer' }
      ]
    }
  ]);

  if (!answers.username || !answers.email) {
    console.log('User creation cancelled.');
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO users (username, email, display_name, bio, is_active)
       VALUES (@username, @email, @display_name, @bio, 1)`
    )
    .run(answers);

  db.prepare(`INSERT INTO user_roles (user_id, role) VALUES (?, ?)`).run(info.lastInsertRowid, answers.role as RoleType);
  console.log('User created with id', info.lastInsertRowid);
};

const toggleUser = async () => {
  const users = db.prepare('SELECT id, username, is_active FROM users').all();
  if (!users.length) {
    console.log('No users found.');
    return;
  }

  const { userId } = await prompts({
    name: 'userId',
    message: 'Select user',
    type: 'select',
    choices: users.map((u: any) => ({ title: `${u.username} (${u.is_active ? 'active' : 'inactive'})`, value: u.id }))
  });

  if (!userId) return;

  const current = db.prepare('SELECT is_active FROM users WHERE id = ?').get(userId) as { is_active: number };
  const next = current.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(next, userId);
  console.log('User state updated.');
};

const changeRole = async () => {
  const users = db
    .prepare(
      `SELECT u.id, u.username, COALESCE(r.role, 'viewer') as role
       FROM users u
       LEFT JOIN user_roles r ON r.user_id = u.id`
    )
    .all();

  if (!users.length) {
    console.log('No users found.');
    return;
  }

  const { userId, newRole } = await prompts([
    {
      name: 'userId',
      message: 'Select user',
      type: 'select',
      choices: users.map((u: any) => ({ title: `${u.username} (${u.role})`, value: u.id }))
    },
    {
      name: 'newRole',
      message: 'Role',
      type: 'select',
      choices: [
        { title: 'Admin', value: 'admin' },
        { title: 'Editor', value: 'editor' },
        { title: 'Viewer', value: 'viewer' }
      ]
    }
  ]);

  if (!userId) return;

  db.prepare(`INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role`).run(userId, newRole as RoleType);
  console.log('Role updated.');
};

const main = async () => {
  let exit = false;
  while (!exit) {
    const { action } = await prompts({
      name: 'action',
      type: 'select',
      message: 'User management',
      choices: [
        { title: 'List users', value: 'list' },
        { title: 'Create user', value: 'create' },
        { title: 'Toggle active state', value: 'toggle' },
        { title: 'Change role', value: 'role' },
        { title: 'Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'list':
        listUsers();
        break;
      case 'create':
        await createUser();
        break;
      case 'toggle':
        await toggleUser();
        break;
      case 'role':
        await changeRole();
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
