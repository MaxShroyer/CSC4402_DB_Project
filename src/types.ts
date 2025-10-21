// TypeScript Type Definitions for Online Wiki Database

export interface UserRole {
    role_id: number;
    role_name: string;
    can_create_articles: boolean;
    can_edit_articles: boolean;
    can_delete_articles: boolean;
    can_moderate: boolean;
    can_admin: boolean;
    description: string | null;
}

export interface User {
    user_id: number;
    username: string;
    email: string;
    password_hash: string;
    role_id: number;
    bio: string | null;
    created_at: string;
    last_login: string | null;
    is_active: boolean;
}

export interface Category {
    category_id: number;
    category_name: string;
    description: string | null;
    parent_category_id: number | null;
    created_at: string;
}

export interface Article {
    article_id: number;
    title: string;
    slug: string;
    author_id: number;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    is_locked: boolean;
    view_count: number;
}

export interface Revision {
    revision_id: number;
    article_id: number;
    editor_id: number;
    content: string;
    revision_comment: string | null;
    created_at: string;
    word_count: number;
}

export interface Comment {
    comment_id: number;
    article_id: number;
    user_id: number;
    parent_comment_id: number | null;
    content: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

export interface Tag {
    tag_id: number;
    tag_name: string;
    description: string | null;
    created_at: string;
}

export interface Media {
    media_id: number;
    article_id: number;
    uploader_id: number;
    filename: string;
    file_type: string;
    file_size: number;
    file_path: string;
    alt_text: string | null;
    created_at: string;
}

export interface ViewStatistic {
    stat_id: number;
    article_id: number;
    user_id: number | null;
    viewed_at: string;
    ip_address: string | null;
    user_agent: string | null;
}

