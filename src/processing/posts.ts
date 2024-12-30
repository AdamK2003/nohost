import { ne } from "drizzle-orm";
import {
  getComments,
  getPost,
  hasPost,
  insertComments,
  insertPost,
} from "../db/functions.js";
import { posts } from "../db/schema.js";
import { config } from "../defs.js";
import {
  commentsObjectToArray,
  fetchPost,
  postToPostStub,
} from "../functions/posts.js";
import { shiftMap, shiftSet, sleep } from "../functions/utils.js";
import * as types from "../types/types.js";
import { queueProject } from "./projects.js";
import { queueTag } from "./tags.js";
import { queueComments } from "./comments.js";

let postStubQueue: Map<number, string> = new Map<number, string>();
let processingPostStubs: Set<number> = new Set<number>();
let processedPostStubs: Set<number> = new Set<number>();
let postQueue: Set<number> = new Set<number>();
let processingPosts: Set<number> = new Set<number>();
let processedPosts: Set<number> = new Set<number>();

export async function processNextPostStub() {
  const next = shiftMap(postStubQueue);
  if (next && processingPostStubCount() < (config.concurrency?.posts || 2)) {
    processPostStub({
      postId: next[0],
      handle: next[1],
    });
    return true;
  }
  return false;
}

export function processingPostStubCount() {
  return processingPostStubs.size;
}

export function wasPostStubSeen(postStub: types.PostStub): boolean {
  return (
    postStubQueue.has(postStub.postId) ||
    processingPostStubs.has(postStub.postId) ||
    processedPostStubs.has(postStub.postId)
  );
}

export async function queuePostStub(
  postStub: types.PostStub,
  force: boolean = false
) {
  if (await hasPost(postStub)) return queueExistingPost(postStub);
  if (!force && wasPostStubSeen(postStub)) return;
  if (postStubQueue.set(postStub.postId, postStub.handle))
    console.log("Queued post", postStub.postId);
}

export async function queueExistingPost(postStub: types.PostStub) {
  const post = await getPost(postStub);
  const comments = await getComments(postStub);

  if (post) await queuePost(post);
  await queueComments(comments);
}

export async function processPostStub(postStub: types.PostStub) {
  if (processedPostStubs.has(postStub.postId)) return;
  processingPostStubs.add(postStub.postId);
  console.log("Fetching post", postStub.postId);
  try {
    const postWithComments = await fetchPost(postStub); // network
    if (postWithComments) {
      await queuePost(postWithComments.post);
      await queueComments(commentsObjectToArray(postWithComments.comments));
    }
    processedPostStubs.add(postStub.postId);
  } catch (e) {
    console.log("Error on fetching post %d, queueing again", postStub.postId);
    console.debug(e);
    queuePostStub(postStub, true);
  }
  await sleep(config.ratelimits?.posts || 500);
  processingPostStubs.delete(postStub.postId);
  processNextPostStub();
}

export async function processNextPost() {
  const next = shiftSet(postQueue);
  if (next) {
    const post = await getPost(next);
    if (post) {
      processPost(post);
      return true;
    }
  }
  return false;
}

export function processingPostCount() {
  return processingPosts.size;
}

export function wasPostSeen(post: number): boolean {
  return (
    postQueue.has(post) || processingPosts.has(post) || processedPosts.has(post)
  );
}

export async function queuePost(post: types.Post) {
  if (wasPostSeen(post.postId)) return;
  await insertPost(post);
  if (postQueue.add(post.postId)) console.log("Queued post", post.postId);
}

export async function processPost(post: types.Post) {
  processingPosts.add(post.postId);
  extractPostsFromPost(post);
  extractProjectsFromPost(post);
  extractTagsFromPost(post);
  processedPosts.add(post.postId);
  processingPosts.delete(post.postId);
  processNextPost();
}

export function extractPostsFromPost(post: types.Post) {
  for (const p of post.shareTree) {
    queuePost(p);
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
