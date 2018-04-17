const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next){
    res.render('signup')
})

// POST /signup 用户注册
/**
 * 我们使用 express-formidable 处理表单的上传
 * 表单普通字段挂载到 req.fields 上
 * 表单上传后的文件挂载到req.files 上
 * 文件存储在 public/img 目录下
 */
router.post('/', checkNotLogin, function(req, res, next){
    // res.send('注册')
    const name = req.fields.name
    const gender = req.fields.gender
    const bio = req.fields.bio
    const avatar = req.files.avatar.path.split(path.sep).pop()
    let password = req.fields.password
    const repassword = req.fields.repassword

    // 校检参数
    /**
     * 校验通过后将用户信息插入到 MongoDB 中
     * 成功则跳转到主页并显示『注册成功』的通知
     * 失败（如用户名被占用）则跳转回注册页面并显示『用户名已被占用』的通知
     */
    try{
      if(!(name.length >= 1 && name.length <= 10)){
        throw new Error('名字请限制在1-10个字符')
      }

      if(['m','f','x'].indexOf(gender) === -1){
        throw new Error('性别只能是m f x')
      }

      if(!(bio.length >= 1 && bio.length <= 30)){
        throw new Error('个人简介请限制在1-30个字符')
      }

      if(!req.files.avatar.name){
        throw new Error('缺少头像')
      }

      if(password.length < 6){
        throw new Error('密码至少 6 个字符')
      }

      if(password !== repassword){
        throw new Error('两次输入的密码不一致')
      }
    } catch (e){
      // 注册失败 异步删除上传的头像
      /**
       * 注册失败时（参数校验失败或者存数据库时出错）
       * 删除已经上传到 public/img 目录下的头像
       */
      fs.unlink(req.files.avatar.path)
      req.flash('error', e.message)
      return res.redirect('/signup')
    }

    // 明文密码加密
    /**
     * 我们使用 sha1 加密用户的密码
     * sha1 并不是一种十分安全的加密方式
     * 实际开发中可以使用更安全的 bcrypt 或 scrypt 加密
     */
    password = sha1(password)

    // 待写入的数据库的用户信息
    let user = {
      name: name,
      password: password,
      gender: gender,
      bio: bio,
      avatar: avatar
    }

    // 用户信息写入数据库
    UserModel.create(user)
      .then(function(result){
        // 此 user 是插入mongaodb后的值 包含_id
        user = result.ops[0]
        // 删除密码这种敏感信息 将用户信息存入 session
        delete user.password
        req.session.user = user

        // 写入 flash
        req.flash('success', '注册成功')
        // 转跳到首页
        res.redirect('/posts')
      })
      .catch(function(e){
        // 注册失败 异步删除上传头像
        fs.unlink(req.files.avatar.path)
          // 用户名被占用则跳回注册页 而不是错误页
          if(e.message.match('duplicate key')){
            req.flash('error','用户名已被占用')
            return res.redirect('/signup')
          }
          next(e)
      })
})

module.exports = router
