const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next){
    // res.send('登录页')
    res.render('signin')
})

// POST /signin 用户登录
/**
 * 通过传上来的 name 去数据库中找到对应用户
 * 校验传上来的密码是否跟数据库中的一致
 * 不一致则返回上一页（即登录页）并显示『用户名或密码错误』的通知
 * 一致则将用户信息写入 session，跳转到主页并显示『登录成功』的通知
 */
router.post('/', checkNotLogin, function(req, res, next){
    // res.send('登录')
    const name = req.fields.name
    const password = req.fields.password

    // 校检参数
    try{
      if(!name.length){
        throw new Error('请填写用户名')
      }

      if(!password.length){
        throw new Error('请填写密码')
      }

    } catch(e){
      req.flash('error', e.message)
      return res.redirect('back')
    }

    UserModel.getUserByName(name)
      .then(function(user){
        if (!user) {
          req.flash('error', '用户不存在')
          return res.redirect('back')
        }

        // 检查密码是否匹配
        if(sha1(password) !== user.password){
          req.flash('error', '用户名或密码错误')
          return res.redirect('back')
        }

        req.flash('success','登录成功')
        // 用户信息写入 session
        delete user.password
        req.session.user = user

        // 转跳到主页
        res.redirect('/posts')
      })
      .catch(next)
})

module.exports = router
