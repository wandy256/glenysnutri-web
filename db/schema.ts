import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull().default(""),
    role: text("role").notNull().default("editor"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    category: text("category").notNull().default("Pediatría"),
    coverKey: text("cover_key"),
    status: text("status").notNull().default("draft"),
    authorEmail: text("author_email").notNull().default(""),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("posts_slug_idx").on(table.slug),
    index("posts_status_published_idx").on(table.status, table.publishedAt),
  ],
);

export const postLikes = sqliteTable(
  "post_likes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postSlug: text("post_slug").notNull(),
    visitorId: text("visitor_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("post_likes_post_visitor_idx").on(table.postSlug, table.visitorId)],
);

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postSlug: text("post_slug").notNull(),
  author: text("author").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    objectKey: text("object_key").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    altText: text("alt_text").notNull().default(""),
    title: text("title").notNull().default(""),
    purpose: text("purpose").notNull().default("library"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    uploaderEmail: text("uploader_email").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("media_object_key_idx").on(table.objectKey)],
);

export const instagramPosts = sqliteTable(
  "instagram_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    label: text("label").notNull().default("Instagram"),
    mediaKey: text("media_key"),
    source: text("source").notNull().default("manual"),
    externalId: text("external_id"),
    caption: text("caption").notNull().default(""),
    mediaType: text("media_type").notNull().default(""),
    publishedAt: text("published_at"),
    syncedAt: text("synced_at"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("instagram_posts_url_idx").on(table.url),
    uniqueIndex("instagram_posts_external_id_idx").on(table.externalId),
  ],
);

export const instagramConnections = sqliteTable("instagram_connections", {
  id: integer("id").primaryKey(),
  instagramUserId: text("instagram_user_id").notNull().default(""),
  username: text("username").notNull().default(""),
  tokenCiphertext: text("token_ciphertext").notNull().default(""),
  tokenIv: text("token_iv").notNull().default(""),
  tokenExpiresAt: text("token_expires_at"),
  status: text("status").notNull().default("disconnected"),
  lastSyncedAt: text("last_synced_at"),
  lastError: text("last_error").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const subscribers = sqliteTable(
  "subscribers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("subscribers_email_idx").on(table.email)],
);
