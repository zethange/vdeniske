use super::entity::Post;
use crate::auth::service::LoginError;
use crate::utils::{is_dev, Pageable};
use crate::{post::dto::CreatePostDto, utils::turnstile::confirm_turnstile_token};
use sqlx::{Pool, Postgres};
use uuid::Uuid;

pub async fn get_posts(
    db: &Pool<Postgres>,
    search: String,
    page_size: i64,
    page_number: i64,
) -> Pageable<Vec<Post>> {
    let offset = page_size * (page_number - 1);

    if page_size > 100 {
        return Pageable {
            content: vec![],
            page_size,
            page_number,
            last_page: 0,
        };
    }

    let posts = sqlx::query_as::<_, Post>(
        r#"
            SELECT p.*,
                (SELECT json_agg(u.*) FROM users u WHERE u.id = p.user_id) as author,
                COALESCE((SELECT json_agg(a.*) FROM attachments a WHERE a.post_id = p.id), '[]'::json) as attachments,
                (SELECT count(*) FROM post_likes WHERE post_id = p.id) as likes,
                (SELECT count(*) FROM post_dislikes WHERE post_id = p.id) as dislikes,
                (SELECT count(*) FROM posts WHERE reply_to = p.id) as replies
            FROM posts p
            WHERE p.content ILIKE $1 AND p.reply_to IS NULL
            GROUP BY p.id, p.content, p.user_id, p.created_at
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3;
        "#,
    )
    .bind(format!("%{}%", search.clone().to_lowercase()))
    .bind(page_size)
    .bind(offset)
    .fetch_all(db)
    .await
    .unwrap();

    let row: (i64,) = sqlx::query_as("select count(p.*) from posts p where p.content ilike $1")
        .bind(format!("%{}%", search.clone().to_lowercase()))
        .fetch_one(db)
        .await
        .unwrap();

    Pageable {
        content: posts,
        page_size,
        page_number,
        last_page: (row.0 as f64 / page_size as f64).ceil() as i64,
    }
}

pub async fn get_post_by_id(db: &Pool<Postgres>, id: Uuid) -> Option<Post> {
    let post = sqlx::query_as::<_, Post>(
        r#"
                SELECT p.*,
                    (SELECT json_agg(u.*) FROM users u WHERE u.id = p.user_id) as author,
                    COALESCE((SELECT json_agg(a.*) FROM attachments a WHERE a.post_id = p.id), '[]'::json) as attachments,
                    (SELECT count(*) FROM post_likes WHERE post_id = p.id) as likes,
                    (SELECT count(*) FROM post_dislikes WHERE post_id = p.id) as dislikes,
                    (SELECT count(*) FROM posts WHERE reply_to = p.id) as replies
                FROM posts p
                WHERE p.id = $1
                GROUP BY p.id, p.content, p.user_id;
        "#,
    )
    .bind(id)
    .fetch_one(db)
    .await;

    post.ok()
}

pub async fn create_post(
    db: &Pool<Postgres>,
    dto: CreatePostDto,
    user_id: Uuid,
    ip: String,
) -> Result<Post, LoginError> {
    if !is_dev() {
        let confirmation = confirm_turnstile_token(dto.turnstile_token.clone(), ip)
            .await
            .unwrap();

        if !confirmation.success {
            return Err(LoginError::TurnstileError);
        }
    }

    let post: (Uuid,) = sqlx::query_as(
        r#"
            INSERT INTO posts (content, user_id, reply_to) VALUES ($1, $2, $3) RETURNING id;
        "#,
    )
    .bind(dto.content)
    .bind(user_id)
    .bind(dto.reply_to)
    .fetch_one(db)
    .await
    .unwrap();

    Ok(get_post_by_id(db, post.0).await.unwrap())
}

pub async fn get_posts_by_username(
    db: &Pool<Postgres>,
    username: &String,
    page_size: i64,
    page_number: i64,
) -> Pageable<Vec<Post>> {
    let offset = page_size * (page_number - 1);

    let posts = sqlx::query_as::<_, Post>(
        r#"
        SELECT p.*,
               (SELECT json_agg(u.*) FROM users u WHERE u.id = p.user_id) as author,
               COALESCE((SELECT json_agg(a.*) FROM attachments a WHERE a.post_id = p.id), '[]'::json) as attachments,
               (SELECT count(*) FROM post_likes WHERE post_id = p.id) as likes,
               (SELECT count(*) FROM post_dislikes WHERE post_id = p.id) as dislikes,
               (SELECT count(*) FROM posts WHERE reply_to = p.id) as replies
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE u.username = $1 AND p.reply_to IS NULL
        GROUP BY p.id, p.content, p.user_id, p.created_at
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(username)
    .bind(page_size)
    .bind(offset)
    .fetch_all(db)
    .await
    .unwrap();

    let row: (i64,) = sqlx::query_as("SELECT COUNT(p.*) FROM posts p JOIN users u ON p.user_id = u.id WHERE u.username = $1")
        .bind(username)
        .fetch_one(db)
        .await
        .unwrap();

    Pageable {
        content: posts,
        page_size,
        page_number,
        last_page: (row.0 as f64 / page_size as f64).ceil() as i64,
    }
}

pub async fn get_posts_by_user_id(
    db: &Pool<Postgres>,
    user_id: Uuid,
    page_size: i64,
    page_number: i64,
) -> Pageable<Vec<Post>> {
    let offset = page_size * (page_number - 1);

    let posts = sqlx::query_as::<_, Post>(
        r#"
            SELECT p.*,
                    (SELECT json_agg(u.*) FROM users u WHERE u.id = p.user_id) as author,
                    COALESCE((SELECT json_agg(a.*) FROM attachments a WHERE a.post_id = p.id), '[]'::json) as attachments,
                    (SELECT count(*) FROM post_likes WHERE post_id = p.id) as likes,
                    (SELECT count(*) FROM post_dislikes WHERE post_id = p.id) as dislikes,
                    (SELECT count(*) FROM posts WHERE reply_to = p.id) as replies
            FROM posts p
            WHERE p.user_id = $1 AND p.reply_to IS NULL
            GROUP BY p.id, p.content, p.user_id, p.created_at
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3;
        "#,
    )
    .bind(user_id)
    .bind(page_size)
    .bind(offset)
    .fetch_all(db)
    .await
    .unwrap();

    let row: (i64,) = sqlx::query_as("select count(p.*) from posts p where p.user_id = $1")
        .bind(user_id)
        .fetch_one(db)
        .await
        .unwrap();

    Pageable {
        content: posts,
        page_size,
        page_number,
        last_page: (row.0 as f64 / page_size as f64).ceil() as i64,
    }
}

pub async fn get_replies(
    db: &Pool<Postgres>,
    post_id: Uuid,
    page_size: i64,
    page_number: i64,
) -> Pageable<Vec<Post>> {
    let offset = page_size * (page_number - 1);

    let posts = sqlx::query_as::<_, Post>(
        r#"
            SELECT p.*,
                (SELECT json_agg(u.*) FROM users u WHERE u.id = p.user_id) as author,
                COALESCE((SELECT json_agg(a.*) FROM attachments a WHERE a.post_id = p.id), '[]'::json) as attachments,
                (SELECT count(*) FROM post_likes WHERE post_id = p.id) as likes,
                (SELECT count(*) FROM post_dislikes WHERE post_id = p.id) as dislikes,
                (SELECT count(*) FROM posts WHERE reply_to = p.id) as replies
            FROM posts p
            WHERE p.reply_to = $1
            GROUP BY p.id, p.content, p.user_id, p.created_at
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3;
        "#,
    )
    .bind(post_id)
    .bind(page_size)
    .bind(offset)
    .fetch_all(db)
    .await
    .unwrap();

    let row: (i64,) = sqlx::query_as("select count(p.*) from posts p where p.reply_to = $1")
        .bind(post_id)
        .fetch_one(db)
        .await
        .unwrap();

    Pageable {
        content: posts,
        page_size,
        page_number,
        last_page: (row.0 as f64 / page_size as f64).ceil() as i64,
    }
}
