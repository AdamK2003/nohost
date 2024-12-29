import * as types from "../types/types.js";
import { ax as client } from "../defs.js";
import { getComments, getPost } from "../db/functions.js";

export async function fetchPost(
  post: types.PostStub
): Promise<types.PostWithComments | null> {
  const { handle, postId } = post;

  try {
    const response = await client.get("api/v1/trpc/posts.singlePost", {
      params: {
        batch: 0,
        input: JSON.stringify({
          "0": {
            handle,
            postId,
          },
        }),
      },
    });

    return response.data[0].result.data as types.PostWithComments;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function maybeFetchPost(
  post: types.PostStub
): Promise<types.PostWithComments | null> {
  const dbPost = await getPost(post);
  if (dbPost) {
    const comments = await getComments(post);
    return {
      post: dbPost,
      comments: {
        comments,
      },
    };
  } else {
    return fetchPost(post);
  }
}

export function getPostStubFromUrl(url: string): types.PostStub {
  // URL example: https://cohost.org/iliana/post/45558-so-you-d-like-to-wri
  const mainUrl = url.split("//").pop();
  if (!mainUrl) {
    throw new Error("Invalid URL");
  }
  const urlParts = mainUrl.split("/");
  if (
    urlParts.length < 4 ||
    urlParts[2] !== "post" ||
    urlParts[0] !== "cohost.org"
  ) {
    throw new Error("Invalid URL");
  }
  const handle = urlParts[1];
  const postId = urlParts[3].split("-")[0];
  return { handle, postId: parseInt(postId) };
}

export function isPostWithComments(
  post: object
): post is types.PostWithComments {
  return post.hasOwnProperty("post") && post.hasOwnProperty("comments");
}

export function postToPostStub(post: types.Post): types.PostStub {
  return {
    postId: post.postId,
    handle: post.postingProject.handle,
  };
}

export function commentsObjectToArray(commentsObj: types.CommentsObject) {
  let comments: types.Comment[] = [];
  for (const key in commentsObj) {
    comments = [...comments, ...commentsObj[key]];
  }
  return comments;
}
