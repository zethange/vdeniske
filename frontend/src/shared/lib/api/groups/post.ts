import { Configuration } from "../configuration";
import { User } from "./user";

export type Pageable<T> = {
  content: T[];
  page_size: number;
  page_number: number;
  last_page: number;
};

export type Attachment = {
  id: string;
  type: string;
  filename: string;
};

export type Post = {
  id: string;
  content: string;
  author: User[];
  attachments: Attachment[];
};

export class PostController {
  constructor(private config: Configuration) {}

  async getPosts(page: number): Promise<Pageable<Post>> {
    const res = await fetch(
      `${this.config.basePath}/posts?page_size=10&page_number=${page}&search`
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();

    return data;
  }

  async getPostsByUserId(
    userId: string,
    page: number
  ): Promise<Pageable<Post>> {
    const res = await fetch(
      `${this.config.basePath}/users/${userId}/posts?page_size=10&page_number=${page}&search`
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();

    return data;
  }
}