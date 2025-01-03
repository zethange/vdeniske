import { A, useNavigate } from "@solidjs/router";
import { Reply, ThumbsDown, ThumbsUp } from "lucide-solid";
import { Component, createSignal, For, Show } from "solid-js";
import { postApi } from "../../../shared/lib/api";
import { type Post as PostType } from "../../../shared/lib/api/groups/post";
import { getFileType } from "~/shared/lib";
import { ImageViewer } from "~/shared/ui";

export const Post: Component<{ post: PostType; refetch: () => void }> = (
  props
) => {
  const [selectedImage, setSelectedImage] = createSignal<string | null>(null);
  const likePost = async () => {
    await postApi.likePost(props.post.id);
    props.refetch();
  };

  const dislikePost = async () => {
    await postApi.dislikePost(props.post.id);
    props.refetch();
  };

  const navigate = useNavigate();

  return (
    <div class="text-white p-3 border-b border-zinc-900">
      <div class="flex gap-2">
        <A href={`/users/${props.post.author[0].username}`}>
          <img
            src={props.post.author[0].avatar}
            alt={props.post.author[0].name}
            class="h-12 min-w-12 aspect-square border border-zinc-900 rounded-full"
          />
        </A>
        <div>
          <A href={`/users/${props.post.author[0].username}`}>
            <div class="flex items-center gap-2">
              <div class="flex gap-2 items-center">
                <span class="font-bold text-md">
                  {props.post.author[0].name}
                </span>
                <span class="font-medium text-md text-zinc-500">
                  @{props.post.author[0].username}
                </span>
              </div>
            </div>
          </A>
          <p class="break-all whitespace-pre-wrap">{props.post.content}</p>
          <Show
            when={
              props.post.attachments.filter(
                (a) => getFileType(a.type) == "image"
              ).length > 0
            }
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 py-2">
              <For
                each={props.post.attachments.filter(
                  (a) => getFileType(a.type) === "image"
                )}
              >
                {(image) => (
                  <div class="relative group overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div
                      class="relative aspect-[4/3] overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(image.filename)}
                    >
                      <img
                        src={image.filename}
                        alt={image.filename}
                        class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </For>
            </div>
            <Show when={selectedImage()}>
              <ImageViewer
                isOpen={selectedImage() != null}
                src={selectedImage()!}
                onClose={() => setSelectedImage(null)}
              />
            </Show>
          </Show>
          <div class="flex gap-2 items-center mt-2">
            <div
              class="flex gap-1 items-center cursor-pointer active:scale-105"
              onClick={likePost}
            >
              <ThumbsUp class="h-5" />
              <span class="text-sm font-bold text-zinc-400">
                {props.post.likes || 0}
              </span>
            </div>

            <div
              class="flex gap-1 items-center cursor-pointer active:scale-105"
              onClick={dislikePost}
            >
              <ThumbsDown class="h-5" />
              <span class="text-sm font-bold text-zinc-400">
                {props.post.dislikes || 0}
              </span>
            </div>

            <div
              class="flex gap-1 items-center cursor-pointer active:scale-105"
              onClick={() => {
                navigate(`/posts/${props.post.id}`, { resolve: true });
                // location.href = `/posts/${props.post.id}`;
              }}
            >
              <Reply class="h-5" />
              <span class="text-sm font-bold text-zinc-400">
                {props.post.replies || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
