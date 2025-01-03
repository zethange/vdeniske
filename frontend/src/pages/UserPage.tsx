import { useStore } from "@nanostores/solid";
import { useParams } from "@solidjs/router";
import { createResource, createSignal, Show } from "solid-js";
import InfiniteScroll from "~/shared/ui/InfiniteScroll";
import { Post } from "../entities/post";
import { $currentUser } from "../entities/user";
import { UpdateUserModal } from "../features/user";
import { postApi, userApi } from "../shared/lib/api";

export const UserPage = () => {
  const { username } = useParams();
  const currentUser = useStore($currentUser);
  const [user, { refetch }] = createResource(() => {
    return userApi.getUser(username);
  });

  const [loading, setLoading] = createSignal(false);
  const [posts, { mutate }] = createResource(() => {
    return postApi.getPostsByUsername(username, 1);
  });

  const refetchPost = async (id: string) => {
    const post = await postApi.getPostById(id);

    mutate((prev) => {
      const prevClone = structuredClone(prev);
      const postIndex = prevClone!.content.findIndex((post) => post.id === id);
      prevClone!.content[postIndex] = post;

      return prevClone;
    });
  };

  let page = 1;

  async function onUploadAvatar() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      const res = await userApi.updateAvatar(formData);
      $currentUser.set(res);
      refetchAll();
    };
    input.click();
  }

  async function refetchAll() {
    const user = await refetch();

    mutate((prev) => {
      const prevClone = structuredClone(prev);
      prevClone!.content = prevClone!.content.map((post) => ({
        ...post,
        author: post.author
          .filter((user) => user.id == currentUser()?.id)
          .map((u) => ({ ...u, avatar: user?.avatar || "" })),
      }));

      return prevClone;
    });
  }

  async function loadMore() {
    if (page >= (posts()?.last_page ?? 0)) return [];
    page++;

    setLoading(true);
    const newPosts = await postApi.getPostsByUsername(username, page);

    mutate((prev) => {
      const prevClone = structuredClone(prev);

      prevClone!.page_number = newPosts.page_number;
      prevClone!.last_page = newPosts.last_page;

      prevClone!.content.push(...newPosts.content);

      return prevClone;
    });
    setLoading(false);

    return newPosts.content;
  }

  return (
    <>
      <div class="flex justify-between p-2 border-b border-zinc-900">
        <div class="flex flex-col">
          <h1 class="font-bold text-2xl">{user()?.name}</h1>
          <p class="text-lg">@{user()?.username}</p>
          <Show when={user()?.id == currentUser()?.id}>
            <UpdateUserModal refetch={refetchAll} />
          </Show>
        </div>
        <div>
          <img
            src={user()?.avatar}
            alt={user()?.name}
            class="h-32 w-32 rounded-full cursor-pointer"
            onClick={() => user()?.id == currentUser()?.id && onUploadAvatar()}
          />
        </div>
      </div>

      <div class="flex flex-col">
        <InfiniteScroll
          items={posts()?.content || []}
          loadMore={loadMore}
          renderItem={(post) => (
            <Post post={post} refetch={() => refetchPost(post.id)} />
          )}
          isLoading={loading()}
        />
      </div>
    </>
  );
};
