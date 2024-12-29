import { ax, config } from "../defs.js";
import { queuePost } from "../processing/posts.js";
import * as types from "../types/types.js";
import { fetchPost, postToPostStub } from "./posts.js";
import { sleep } from "./utils.js";

export async function fetchPostsFromProject(
  handle: string,
  page: number = 0,
  getAll: boolean = true
): Promise<types.ProjectPostPage> {
  const response = await ax.get("api/v1/trpc/posts.profilePosts", {
    params: {
      batch: 0,
      input: JSON.stringify({
        "0": {
          projectHandle: handle,
          page,
          options: {
            pinnedPostsAtTop: false,
            hideReplies: false,
            hideShares: false,
            hideAsks: false,
            viewingOnProjectPage: false,
          },
        },
      }),
    },
  });

  const postPage = response.data[0].result.data as types.ProjectPostPage;

  if (getAll) {
    for (const post of postPage.posts) {
      queuePost(postToPostStub(post));
    }
    if (postPage.pagination.morePagesForward) {
      await sleep(config.ratelimits?.projects || 500);
      await fetchPostsFromProject(handle, postPage.pagination.nextPage);
    }
  }
  return postPage;
}
