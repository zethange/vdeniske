import { type RouteDefinition } from "@solidjs/router";
import { MainPage } from "~/pages/MainPage";
import { MainLayout } from "~/widgets/MainLayout";
import { UserPage } from "~/pages/UserPage";
import { PostPage } from "~/pages/PostPage";

export const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "/",
        component: MainPage,
      },
      {
        path: "/users/:username",
        component: UserPage,
      },
      {
        path: "/posts/:postId",
        component: PostPage,
      },
    ],
  },
] satisfies RouteDefinition[];
