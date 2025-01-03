use super::dto::UpdateUserReq;
use super::service::{get_user_by_id, get_user_by_username, get_users, update_avatar, update_user};
use crate::post::service::{get_posts_by_user_id, get_posts_by_username};
use crate::user::entity::User;
use crate::{auth::middleware::auth, utils::PaginationReq};
use axum::routing::put;
use axum::{
    extract::{Multipart, Path, Query},
    middleware,
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};
use sqlx::{Pool, Postgres};
use std::str::FromStr;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

pub fn user_router() -> Router {
    let router = Router::new()
        .route("/me", get(get_me_route).put(update_me_route))
        .route("/me/avatar", put(update_avatar_route))
        .route_layer(middleware::from_fn(auth))
        // without auth
        .route("/", get(get_users_route))
        // .route("/:id", get(get_user_by_id_route))
        .route("/:username", get(get_user_by_username_route))
        .route("/:username/posts", get(get_posts_by_username_route));

    router
}

async fn get_users_route(Extension(db): Extension<Pool<Postgres>>) -> impl IntoResponse {
    let users = get_users(&db).await;
    Json(users)
}

async fn get_user_by_id_route(
    Extension(db): Extension<Pool<Postgres>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let user = get_user_by_id(&db, Uuid::from_str(id.as_str()).unwrap()).await;
    Json(user)
}
async fn get_user_by_username_route(
    Extension(db): Extension<Pool<Postgres>>,
    Path(username): Path<String>,
) -> impl IntoResponse{
    let user = get_user_by_username(&db, username).await;
    Json(user)
}

async fn get_posts_by_username_route(
    Extension(db): Extension<Pool<Postgres>>,
    Path(id): Path<String>,
    Query(pagination): Query<PaginationReq>,
) -> impl IntoResponse {
    let posts = get_posts_by_username(
        &db,
        &id,
        pagination.page_size,
        pagination.page_number,
    )
    .await;

    Json(posts)
}

async fn get_posts_by_user_id_route(
    Extension(db): Extension<Pool<Postgres>>,
    Path(id): Path<String>,
    Query(pagination): Query<PaginationReq>,
) -> impl IntoResponse {
    let posts = get_posts_by_user_id(
        &db,
        Uuid::from_str(id.as_str()).unwrap(),
        pagination.page_size,
        pagination.page_number,
    )
    .await;

    Json(posts)
}

async fn get_me_route(Extension(user): Extension<User>) -> impl IntoResponse {
    Json(user)
}

async fn update_me_route(
    Extension(db): Extension<Pool<Postgres>>,
    Extension(user): Extension<User>,
    Json(dto): Json<UpdateUserReq>,
) -> impl IntoResponse {
    let user = update_user(&db, user.id, dto).await;

    Json(user)
}

async fn update_avatar_route(
    Extension(db): Extension<Pool<Postgres>>,
    Extension(user): Extension<User>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_name = String::new();
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        if name == "image" {
            let file_type = field.content_type().unwrap().to_string();
            let file_extension = file_type.split('/').last().unwrap();

            let file_data = field.bytes().await.unwrap();
            let id = Uuid::new_v4().to_string();
            file_name = format!("{}.{}", id, file_extension);
            let file_path = format!("/storage/avatars/{}", file_name);

            let mut file = File::create(&file_path).await.unwrap();
            file.write_all(&file_data).await.unwrap();
        }
    }

    Json(update_avatar(&db, user.id, file_name).await)
}
