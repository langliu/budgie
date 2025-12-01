// schema.ts

import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { v7 as uuidv7 } from 'uuid'

export const models = sqliteTable('models', {
  // 可选字段
  alias: text('alias'), // 艺名/别名
  avatarUrl: text('avatar_url'), // 头像URL
  bio: text('bio'), // 简介
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  homepageUrl: text('homepage_url'), // 个人主页URL
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()), // UUIDv7
  instagramUrl: text('instagram_url'), // Instagram URL
  name: text('name').notNull(), // 模特姓名
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  weiboUrl: text('weibo_url'), // 微博 URL
  xUrl: text('x_url'), // X (Twitter) URL
  youtubeUrl: text('youtube_url'),
})

// 模特的关系
export const modelsRelations = relations(models, ({ many }) => ({
  albumModels: many(albumModels), // 通过中间表关联到专辑
}))

export const albums = sqliteTable('albums', {
  coverImageUrl: text('cover_image_url'), // 封面图URL
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  description: text('description'), // 专辑描述
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()), // UUIDv7
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }), // 发布日期
  title: text('title').notNull(), // 专辑标题
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// 专辑的关系
export const albumsRelations = relations(albums, ({ many }) => ({
  albumModels: many(albumModels), // 通过中间表关联到模特
  albumTags: many(albumTags), // 通过中间表关联到标签
  images: many(albumImages), // 专辑图片
}))

// 专辑图片表
export const albumImages = sqliteTable('album_images', {
  albumId: text('album_id')
    .notNull()
    .references(() => albums.id, { onDelete: 'cascade' }),
  caption: text('caption'), // 图片描述/标题（可选）
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  fileSize: integer('file_size'), // 文件大小（字节）
  height: integer('height'), // 图片高度（可选，用于布局）
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  key: text('key').notNull(), // R2 对象 key，用于删除
  sortOrder: integer('sort_order').notNull().default(0), // 排序顺序
  url: text('url').notNull(), // 图片 URL（R2 存储路径）
  width: integer('width'), // 图片宽度（可选，用于布局）
})

// 专辑图片的关系
export const albumImagesRelations = relations(albumImages, ({ one }) => ({
  album: one(albums, {
    fields: [albumImages.albumId],
    references: [albums.id],
  }),
}))

export const tags = sqliteTable('tags', {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()), // UUIDv7
  name: text('name').notNull().unique(), // 标签名，必须唯一（如 "日系", "泳装"）
})

// 标签的关系
export const tagsRelations = relations(tags, ({ many }) => ({
  albumTags: many(albumTags),
}))

// 中间表：建立专辑和模特的多对多关系
export const albumModels = sqliteTable('album_models', {
  albumId: text('album_id')
    .notNull()
    .references(() => albums.id, { onDelete: 'cascade' }),
  // 可选：记录该模特在此专辑中的角色或备注
  // role: text("role"),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()), // UUIDv7
  modelId: text('model_id')
    .notNull()
    .references(() => models.id, { onDelete: 'cascade' }),
})

// 中间表的关系
export const albumModelsRelations = relations(albumModels, ({ one }) => ({
  album: one(albums, {
    fields: [albumModels.albumId],
    references: [albums.id],
  }),
  model: one(models, {
    fields: [albumModels.modelId],
    references: [models.id],
  }),
}))

// 中间表：建立专辑和标签的多对多关系
export const albumTags = sqliteTable('album_tags', {
  albumId: text('album_id')
    .notNull()
    .references(() => albums.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()), // UUIDv7
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
})

// 中间表的关系
export const albumTagsRelations = relations(albumTags, ({ one }) => ({
  album: one(albums, {
    fields: [albumTags.albumId],
    references: [albums.id],
  }),
  tag: one(tags, {
    fields: [albumTags.tagId],
    references: [tags.id],
  }),
}))
