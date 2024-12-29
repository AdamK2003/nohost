import { insertPost } from "../db/functions.js";
import { posts } from "../db/schema.js";
import { config } from "../defs.js";
import {
  commentsObjectToArray,
  maybeFetchPost,
  postToPostStub,
} from "../functions/posts.js";
import { shiftMap, sleep } from "../functions/utils.js";
import * as types from "../types/types.js";
import { queueProject } from "./projects.js";
import { queueTag } from "./tags.js";

let postQueue: Map<number, string> = new Map<number, string>();
let processingPosts: Set<number> = new Set<number>();
let processedPosts: Set<number> = new Set<number>();

export async function processNextPost() {
  const next = shiftMap(postQueue);
  if (next && processingPostsCount() < (config.concurrency?.posts || 2)) {
    processPost({
      postId: next[0],
      handle: next[1],
    });
    return true;
  }
  return false;
}

export function processingPostsCount() {
  return processingPosts.size;
}

export function queuePost(postStub: types.PostStub) {
  if (processedPosts.has(postStub.postId)) return;
  console.log("Queued post", postStub.postId);
  postQueue.set(postStub.postId, postStub.handle);
}

export async function processPost(postStub: types.PostStub) {
  if (processedPosts.has(postStub.postId)) return;
  processingPosts.add(postStub.postId);
  console.log("Processing post", postStub.postId);
  try {
    const postWithComments = await maybeFetchPost(postStub);
    if (postWithComments) {
      await insertPost(postWithComments);
      extractPostsFromPost(postWithComments.post);
      extractTagsFromPost(postWithComments.post);
      extractProjectsFromPostComments(
        commentsObjectToArray(postWithComments.comments)
      );
    }
    processedPosts.add(postStub.postId);
  } catch (e) {
    console.log("Error on post %d, queueing again", postStub.postId);
    console.debug(e);
    queuePost(postStub);
  }
  await sleep(config.ratelimits?.posts || 500);
  processingPosts.delete(postStub.postId);
  processNextPost();
}

export function extractPostsFromPost(post: types.Post) {
  for (const p of post.shareTree) {
    queuePost(postToPostStub(p));
  }
}

async function extractProjectsFromPostComments(comments: types.Comment[]) {
  for (const comment of comments) {
    queueProject(comment.poster);
  }
}

export function extractProjectsFromPost(post: types.Post) {
  queueProject(post.postingProject);
  for (const project of post.relatedProjects) {
    queueProject(project);
  }
}

export function extractTagsFromPost(post: types.Post) {
  for (const tag of post.tags) {
    queueTag(tag);
  }
}
