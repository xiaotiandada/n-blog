const config = require('config-lite')(__dirname)
const Mongolass = require('mongolass')
const mongolass = new Mongolass()
mongolass.connect(config.mongodb)


/**
 * 我们定义了用户表的 schema，生成并导出了 User 这个 model，
 * 同时设置了 name 的唯一索引，保证用户名是不重复的。
 * 小提示：required: true 表示该字段是必需的，
 * default: xxx 用于创建文档时设置默认值。
 * 更多关于 Mongolass 的 schema 的用法，
 * 请查阅 another-json-schema。
 * 小提示：Mongolass 中的 model
 * 你可以认为相当于 mongodb 中的 collection，
 * 只不过添加了插件的功能。
 */
exports.User = mongolass.model('User',{
    name: {type: 'string', required: true},
    password: {type: 'string', required: true},
    avatar: {type: 'string', required: true},
    gender: {type: 'string', enum: ['m', 'f', 'x'], defalut: 'x'},
    bio: {type: 'string', required: true}
})

exports.User.index({name: 1},{unique: true}).exec() //根据用户名找到用户， 用户名全局唯一

const moment = require('moment')
const objectIdToTimestamp = require('objectid-to-timestamp')


// 根据 id 生成创建时间 createed_at
// 24 位长的 ObjectId 前 4 个字节是精确到秒的时间戳
/**
 * 0|1|2|3|4|5|6|7|8|9|10|11
 * 时间戳  | 机器 |PID|计数器
 */

// 根据 id 生成创建时间 created_at
// addCreatedAt 是在 lib/mongo.js 中 mongolass 上注册的
// addCreatedAt 对所有 Model 都有效。
mongolass.plugin('addCreatedAt', {
  afterFind: function (results) {
    results.forEach(function (item) {
      item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm')
    })
    return results
  },
  afterFindOne: function (result) {
    if (result) {
      result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm')
    }
    return result
  }
})

/**
 * 文章模型设计
 * 作者id 标题 正文 点击量
 */
exports.Post = mongolass.model('Post', {
  author: { type: Mongolass.Types.ObjectId, required: true },
  title: {type: 'string', required: true },
  content: { type: 'string', required: true },
  pv: { type: 'number', defalut:0 }
})

exports.Post.index({ author: 1, _id: -1 }).exec() // 按时间创建降序查看用户的文章列表


// 留言的作者 id、留言内容和关联的文章 id 这几个字段
exports.Comment = mongolass.model('Comment', {
  author: { type: Mongolass.Types.ObjectId, required: true },
  content: { type: 'string', required: true },
  postId: { type: Mongolass.Types.ObjectId, required: true }
})

exports.Comment.index({ postId: 1, _id: 1 }).exec() // 通过文章 id 获取该文章下所有留言，按留言创建时间升序
