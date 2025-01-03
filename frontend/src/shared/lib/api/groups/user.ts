import { Configuration } from "../configuration";

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
};

export type UpdateUserReq = {
  name: string;
};

export class UserController {
  constructor(private config: Configuration) {}

  async getUser(username: string): Promise<User | undefined> {
    const res = await fetch(`${this.config.basePath}/users/${username}`);

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();

    return data;
  }

  async getMe(): Promise<User | undefined> {
    const res = await fetch(`${this.config.basePath}/users/me`, {
      headers: {
        Authorization: this.config.accessToken || "",
      },
    });

    return res.json();
  }

  async updateUser(dto: UpdateUserReq): Promise<User> {
    const res = await fetch(`${this.config.basePath}/users/me`, {
      method: "PUT",
      body: JSON.stringify(dto),
      headers: {
        "Content-Type": "application/json",
        Authorization: this.config.accessToken || "",
      },
    });

    return res.json();
  }

  async updateAvatar(formData: FormData) {
    const res = await fetch(`${this.config.basePath}/users/me/avatar`, {
      method: "PUT",
      body: formData,
      headers: {
        // "Content-Type": "multipart/form-data",
        Authorization: this.config.accessToken || "",
      },
    });

    return res.json();
  }
}
