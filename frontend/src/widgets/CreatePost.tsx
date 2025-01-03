import { useStore } from "@nanostores/solid";
import { Plus, SendHorizontal } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { $currentUser } from "~/entities/user";
import { postApi } from "~/shared/lib/api";
import { CreatePostReq } from "~/shared/lib/api/groups/post";
import { Modal, Turnstile } from "~/shared/ui";

export const CreatePost = (props: {
  postId: string | null;
  placeholder: string;
}) => {
  const [isShowTurnstile, setIsShowTurnstile] = createSignal(false);
  const [attachments, setAttachments] = createSignal<File[]>([]);
  const [form, setForm] = createStore<CreatePostReq>({
    content: "",
    reply_to: null,
    turnstile_token: "",
  });

  const attachmentsPreview = createMemo(() => {
    return attachments().map((file) => ({
      src: URL.createObjectURL(file),
      filename: file.name,
    }));
  });

  const createPost = async () => {
    const post = await postApi.createPost({
      ...form,
      reply_to: props.postId,
    });

    const formData = new FormData();
    for (const file of attachments()) {
      formData.append("file", file);
    }

    await postApi.createAttachment(formData, post.id);

    location.reload();
  };

  const currentUser = useStore($currentUser);

  const addAttachment = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setAttachments((prev) => [...prev, file]);
    };
    input.click();
  };
  const onPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const image = item.getAsFile();
        if (!image) continue;

        setAttachments((prev) => [...prev, image]);
      }
    }
  };

  const onDrop = (e: DragEvent) => {
    const items = e.dataTransfer?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();

        const image = item.getAsFile();
        if (!image) continue;

        setAttachments((prev) => [...prev, image]);
      }
    }
  };

  const onDragOver = (e: DragEvent) => {
    const items = e.dataTransfer?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        break;
      }
    }
  };
  return (
    <>
      <Show when={currentUser()}>
        <div class="relative border-b border-zinc-900">
          <Show when={attachmentsPreview().length > 0}>
            <div class="grid grid-cols-1 md:grid-cols-2 overflow-x-auto w-full">
              <For each={attachmentsPreview()}>
                {(preview) => (
                  <div
                    class="relative aspect-[4/3] overflow-hidden cursor-pointer"
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((f) => f.name != preview.filename)
                      )
                    }
                  >
                    <img
                      src={preview.src}
                      alt={preview.filename}
                      class="w-full max-h-64 object-cover transform hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
              </For>
            </div>
          </Show>
          <textarea
            class="w-full bg-black text-white font-medium p-4"
            placeholder={props.placeholder}
            value={form.content}
            onInput={(e) =>
              setForm("content", (e.target as HTMLTextAreaElement).value)
            }
            onPaste={onPaste}
            onDragOver={onDragOver}
            onDrop={onDrop}          
          ></textarea>
          <div class="absolute right-2 bottom-4 text-white flex gap-1 items-center">
            <button onClick={addAttachment}>
              <Plus class="h-4" />
            </button>
            <button
              onClick={() => {
                if (form.content) {
                  setIsShowTurnstile(true);
                }
              }}
            >
              <SendHorizontal class="h-4" />
            </button>
          </div>
        </div>
      </Show>
      <Modal
        isOpen={isShowTurnstile()}
        onClose={() => setIsShowTurnstile(false)}
      >
        <div class="font-medium text-lg">Проверка на дениску</div>
        <Turnstile
          onResult={(token) => {
            setForm("turnstile_token", token);
            requestAnimationFrame(createPost);
          }}
        ></Turnstile>
      </Modal>
    </>
  );
};
