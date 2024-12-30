import { getComment, insertComment } from "../db/functions.js";
import { config } from "../defs.js";
import { shiftSet } from "../functions/utils.js";
import * as types from "../types/types.js";
import { queueProject } from "./projects.js";

let commentQueue: Set<string> = new Set<string>();
let processingComments: Set<string> = new Set<string>();
let processedComments: Set<string> = new Set<string>();

export async function processNextComment() {
  const next = shiftSet(commentQueue);
  if (next) {
    const comment = await getComment(next);
    if (comment) {
      await processComment(comment);
      return true;
    }
  }
  return false;
}

export function processingCommentsCount() {
  return processingComments.size;
}

export async function queueComments(comments: types.Comment[]) {
  for (const comment of comments) {
    await queueComment(comment);
  }
}

export async function queueComment(comment: types.Comment) {
  if (processedComments.has(comment.comment.commentId)) return;
  await insertComment(comment);
  if (commentQueue.add(comment.comment.commentId))
    console.log("Queued comment", comment.comment.commentId);
}

export async function processComment(comment: types.Comment) {
  if (processedComments.has(comment.comment.commentId)) return;
  processingComments.add(comment.comment.commentId);
  queueProject(comment.poster);
  processingComments.delete(comment.comment.commentId);
  processNextComment();
}
