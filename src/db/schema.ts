import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey(),
  projectHandle: text("project"),
  projectId: text("projectId"),
  tags: text("tags"),
  cwTags: text("cwTags"),
  isAdultContent: integer("isAdultContent"),
  json: text("json"),
});

export const postComments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: integer("postId"),
  author: text("author"),
  authorId: integer("authorId"),
  json: text("json"),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey(),
  handle: text("handle"),
  json: text("json"),
});

export const tags = sqliteTable("tags", {
  tag: text("tag").primaryKey(),
  json: text("json"),
});
