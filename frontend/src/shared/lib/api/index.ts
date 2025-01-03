import { Configuration } from "./configuration";
import { AuthController } from "./groups/auth";
import { PostController } from "./groups/post";
import { UserController } from "./groups/user";

const conf = new Configuration(
  localStorage.getItem("accessToken") || undefined,
  import.meta.env.PROD
    ? "https://vdeniske.ru/api/v1"
    : "https://vdeniske.ru/api/v1"
);

const turnstyleSiteKey = "0x4AAAAAAA4DcwcJXshKBpkU";

const authApi = new AuthController(conf);
const postApi = new PostController(conf);
const userApi = new UserController(conf);

export { conf, authApi, postApi, userApi, turnstyleSiteKey };
