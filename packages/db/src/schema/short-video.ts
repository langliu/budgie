import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { v7 as uuidv7 } from 'uuid'

/**
 * 短视频主题表
 * 用于分类管理短视频
 */
export const shortVideoTopic = sqliteTable('short_video_topic', {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  description: text('description').notNull(),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
})

/**
 * 短视频表
 * 存储第三方短视频的元数据
 */
export const shortVideo = sqliteTable(
  'short_video',
  {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text('name').notNull(),
    originalUrl: text('original_url').notNull(),
    r2Key: text('r2_key').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('short_video_created_at_idx').on(table.createdAt)],
)

/**
 * 短视频与主题的关联表（多对多）
 */
export const shortVideoToTopic = sqliteTable(
  'short_video_to_topic',
  {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    topicId: text('topic_id')
      .notNull()
      .references(() => shortVideoTopic.id, { onDelete: 'cascade' }),
    videoId: text('video_id')
      .notNull()
      .references(() => shortVideo.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.videoId, table.topicId] }),
    index('short_video_to_topic_video_id_idx').on(table.videoId),
    index('short_video_to_topic_topic_id_idx').on(table.topicId),
  ],
)

// 表关系定义
export const shortVideoRelations = relations(shortVideo, ({ many }) => ({
  videoToTopics: many(shortVideoToTopic),
}))

export const shortVideoTopicRelations = relations(
  shortVideoTopic,
  ({ many }) => ({
    videoToTopics: many(shortVideoToTopic),
  }),
)

export const shortVideoToTopicRelations = relations(
  shortVideoToTopic,
  ({ one }) => ({
    topic: one(shortVideoTopic, {
      fields: [shortVideoToTopic.topicId],
      references: [shortVideoTopic.id],
    }),
    video: one(shortVideo, {
      fields: [shortVideoToTopic.videoId],
      references: [shortVideo.id],
    }),
  }),
)
