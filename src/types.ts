export type RoleType = 'admin' | 'editor' | 'viewer';

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string | null;
  join_date: string;
  is_active: 0 | 1;
}

export interface UserRole {
  user_id: number;
  role: RoleType;
  assigned_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  published: 0 | 1;
  created_at: string;
  updated_at: string | null;
  author_id: number;
}

export interface Comment {
  id: number;
  article_id: number;
  author_id: number;
  body: string;
  created_at: string;
}

export interface ArticleWithMeta extends Article {
  author_name: string;
  categories: string[];
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalArticles: number;
  publishedArticles: number;
  totalComments: number;
}
