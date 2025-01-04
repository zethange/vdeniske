import { useStore } from "@nanostores/solid";
import { A } from "@solidjs/router";
import { LogIn } from "lucide-solid";
import { Component, createSignal, onMount, ParentProps, Show } from "solid-js";
import { $currentUser } from "../entities/user";
import { AuthModal } from "./auth/AuthModal";
import { userApi } from "../shared/lib/api";

export const MainLayout: Component<ParentProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const user = useStore($currentUser);

  onMount(() => {
    userApi
      .getMe()
      .then((user) => {
        if (user) $currentUser.set(user);
      })
      .catch();
  });

  return (
    <main class="max-w-[720px] min-h-[100dvh] mx-auto md:border-x border-zinc-900 text-white">
      <div class="border-b border-zinc-900 flex items-center justify-between px-2 py-3">
        <A href="/">
          <img src="/vdeniske.svg" alt="Vdeniske logo" class="h-8" />
        </A>
        <Show when={!user()}>
          <button
            class="p-2 rounded-full hover:bg-neutral-800"
            onClick={() => setIsOpen(!isOpen())}
          >
            <LogIn class="text-white mr-1" />
          </button>
        </Show>
        <Show when={user()}>
          <A
            href={`/users/${user()?.id}`}
            class="bg-zinc-800 rounded-full aspect-square px-4 py-2"
          >
            {user()?.name[0]}
          </A>
        </Show>
      </div>
      <div>{props.children}</div>
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </main>
  );
};
