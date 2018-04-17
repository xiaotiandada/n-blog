const path = require('path')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const config = require('config-lite')(__dirname)
const routes = require('./routes')
const pkg = require('./package')
const winston = require('winston')
const expressWinston =  require('express-winston')

const app = express()

// 设置模板目录
app.set('views', path.join(__dirname, 'views'))
// 设置模板引擎为 ejs
app.set('view engine', 'ejs')

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')))

// session 中间件
app.use(session({
    name: config.session.key, // 设置cookie 中保存 session id 的字段名称
    secret : config.session.secret, // 通过设置secret来计算 hash值 并放在cookie中 使产生的signedCookie防止篡改
    resave: true, // 强制刷新 session
    saveUninitialized: false, // 设置为false 过期后cookie 中的session id 自动删除
    cookie: {
        maxAge: config.session.maxAge // 过期时间后， 过期后的cookie中的session id 自动删除
    },
    store: new MongoStore({ // 将 session 储存到 mongodb
        url: config.mongodb // mongodb 地址
    })
}))

// flash 中间件 用来显示通知
app.use(flash())

// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'), // 上传文件目录
    keepExtensions: true //保留后缀
}))

// 设置模板全局变量
app.locals.blog = {
    title: pkg.name,
    description: pkg.description
}

// 添加模板必须的三个变量
/**
 * 调用 res.render 的时候就不用传入这四个变量了
 * express 为我们自动 merge 并传入了模板
 * 所以我们可以在模板中直接使用这四个变量。
 */
app.use(function(req, res, next){
    res.locals.user = req.session.user
    res.locals.success = req.flash('success').toString()
    res.locals.error = req.flash('error').toString()
    next()
})

// 正常请求的日志
app.use(expressWinston.logger({
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/success.log'
    })
  ]
}))
// 路由
routes(app)
// 错误请求的日志
app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log'
    })
  ]
}))

app.use(function(err, req, res, next){
  console.log(err)
  req.flash('error',err.message)
  res.redirect('/posts')
})

// 监听端口
// app.listen(config.port, function(){
//     console.log(`${pkg.name} listening on port ${config.port}`)
// })

if(module.parent){
  // 被 require 则导出app
  module.exports = app
} else {
  // 监听端口 启动程序
  app.listen(config.port, function(){
    console.log(`${pkg.name} listening on port ${config.port}`)
  })
}

/**
 * 中间件的加载顺序很重要。
 * 如上面设置静态文件目录的中间件应该放到 routes(app) 之前加载，
 * 这样静态文件的请求就不会落到业务逻辑的路由里；
 * flash 中间件应该放到 session 中间件之后加载，
 * 因为 flash 是基于 session 实现的
 */
