# VDeniske

![VDeniske logo](https://raw.githubusercontent.com/zethange/vdeniske/refs/heads/master/frontend/public/vdeniske.svg)
A simple social media platform written in Rust/Axum and Solid.js.

## Features

- User registration
- User login
- User avatar upload
- User profile
- Post creation
- Likes/dislikes post

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [PostgreSQL](https://www.postgresql.org/download)
- [Bun](https://bun.sh)

### Start backend

```bash
export DATABASE_URL="postgres://demo:demo@localhost:5432/vdeniske?sslmode=disable"
export POSTGRES_URL=$DATABASE_URL
export MODE=dev

dbmate up
cargo run
```
