import * as types from "../types/types.js";
import { isPostWithComments } from "../functions/posts.js";

import { db } from "../defs.js";
import * as schema from "../db/schema.js";
import { isTagTimelinePage } from "../functions/tags.js";

import { eq } from "drizzle-orm";

export async function insertPost(post: types.Post | types.PostWithComments) {
  let comments = null;
  if (isPostWithComments(post)) {
    comments = post.comments;
    post = post.post;
  }

  await db
    .insert(schema.posts)
    .values({
      id: post.postId,
      projectHandle: post.postingProject.handle,
      tags: JSON.stringify(post.tags),
      cwTags: JSON.stringify(post.cws),
      isAdultContent: +post.effectiveAdultContent,
      json: JSON.stringify(post),
    })
    .onConflictDoNothing();

  if (comments) {
    insertComments(comments);
  }
}

export async function getPost(
  post: number | types.PostStub
): Promise<types.Post | null> {
  if (typeof post != "number") {
    post = post.postId;
  }

  const result = (
    await db.select().from(schema.posts).where(eq(schema.posts.id, post))
  )[0];
  return result?.json ? JSON.parse(result.json) : null;
}

export async function hasPost(post: number | types.PostStub): Promise<boolean> {
  if (typeof post != "number") {
    post = post.postId;
  }

  return (
    (await db.select().from(schema.posts).where(eq(schema.posts.id, post)))
      .length > 0
  );
}

export async function insertComments(
  comments: types.PostWithComments | types.CommentsObject | types.Comment[]
) {
  if (isPostWithComments(comments)) {
    comments = comments.comments;
  }
  if (Array.isArray(comments)) {
    comments = {
      comments: comments,
    };
  }
  for (const post in comments) {
    for (const comment of comments[post]) {
      insertComment(comment);
    }
  }
}

export async function getComments(
  post: number | types.PostStub
): Promise<types.Comment[]> {
  if (typeof post != "number") {
    post = post.postId;
  }

  const result = await db
    .select()
    .from(schema.postComments)
    .where(eq(schema.postComments.postId, post));
  return result
    .filter((e) => {
      return e.json !== null;
    })
    .map((e) => {
      return JSON.parse(e.json as string) as types.Comment;
    });
}

export async function insertComment(comment: types.Comment) {
  await db
    .insert(schema.postComments)
    .values({
      id: comment.comment.commentId,
      postId: comment.comment.postId,
      author: comment.poster?.handle || null,
      authorId: comment.poster?.projectId || null,
      json: JSON.stringify(comment),
    })
    .onConflictDoNothing();
}

export async function getComment(
  commentId: string
): Promise<types.Comment | null> {
  const result = (
    await db
      .select()
      .from(schema.postComments)
      .where(eq(schema.postComments.id, commentId))
  )[0];
  return result.json ? JSON.parse(result.json) : null;
}

export async function hasComment(commentId: string): Promise<boolean> {
  return (
    (
      await db
        .select()
        .from(schema.postComments)
        .where(eq(schema.postComments.id, commentId))
    ).length > 0
  );
}

export async function insertProject(project: types.Project) {
  await db
    .insert(schema.projects)
    .values({
      id: project.projectId,
      handle: project.handle,
      json: JSON.stringify(project),
    })
    .onConflictDoNothing();
}

export async function getProject(
  projectHandle: string
): Promise<types.Project | null> {
  const result = (
    await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.handle, projectHandle))
  )[0];
  return result.json ? JSON.parse(result.json) : null;
}

export async function hasProject(projectHandle: string): Promise<boolean> {
  return (
    (
      await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.handle, projectHandle))
    ).length > 0
  );
}

export async function insertTag(tag: types.Tag | types.TagTimelinePage) {
  if (isTagTimelinePage(tag)) {
    tag = {
      name: tag.tagName,
      relationships: tag.synonymsAndRelatedTags,
    };
  }

  await db
    .insert(schema.tags)
    .values({
      tag: tag.name,
      json: JSON.stringify(tag),
    })
    .onConflictDoNothing();
}

export async function hasTag(tag: string): Promise<boolean> {
  return (
    (await db.select().from(schema.tags).where(eq(schema.tags.tag, tag)))
      .length > 0
  );
}
