func_user = __F 'user'
config = require './../config.coffee'
authorize=require("./../lib/sdk/authorize.js")
Sina=require("./../lib/sdk/sina.js")
md5 = require 'MD5'
querystring = require 'querystring'
uuid = require 'node-uuid'
module.exports.controllers = 
  "/login":
    get:(req,res,next)->
      res.locals.link = authorize.sina
        app_key:config.sdks.sina.app_key,
        redirect_uri:config.sdks.sina.redirect_uri+(if req.query.redirect then ("?redirect="+req.query.redirect) else "?") + (if req.query.mini then "&mini=1" else "")
        client_id:config.sdks.sina.app_key
      if req.query.jump 
        res.redirect res.locals.link
      else if req.query.mini 
        res.render 'minilogin.jade'
      else
        res.render 'login.jade'
  "/logout":
    get:(req,res,next)->
      res.cookie '_p', "", 
        expires: new Date(Date.now() + 1000*60*60*24*7)
        httpOnly: true
        domain:"html-js.com"
      req.session = null
      res.redirect req.query.redirect || '/user'
  "/sina_cb":
    get:(req,res,next)->
      code = req.query.code
      link = authorize.sina
        app_key:config.sdks.sina.app_key,
        redirect_uri:config.sdks.sina.redirect_uri+(if req.query.redirect then ("?redirect="+req.query.redirect) else "?") + (if req.query.mini then "&mini=1" else "")
        client_id:config.sdks.sina.app_key
      _sina=new Sina(config.sdks.sina)
      if !code
        res.send '绑定错误:'+error.message+'，请<a href='+link+'>重新绑定</a>'
        return
      _sina.oauth.accesstoken code,(error,data)->
        if error 
          res.send '绑定错误:'+error.message+'，请<a href='+link+'>重新绑定</a>'
        else
          access_token = data.access_token
          func_user.getByWeiboId data.uid,(error,user)->
            if user
              user.updateAttributes
                weibo_token:access_token
              .success ()->
                res.cookie '_p', user.id+":"+md5(user.weibo_token), 
                  expires: new Date(Date.now() + 1000*60*60*24*7)
                  httpOnly: true
                  domain:"html-js.com"
                if not user.email
                  res.redirect '/user/email?'+querystring.stringify(req.query)
                  return
                if req.query.mini
                  res.send '<script>parent.window.HtmlJS.util.logincallback&&parent.window.HtmlJS.util.logincallback()</script>'
                else
                  res.redirect req.query.redirect||"/user"
              .error (error)->
                res.send '绑定错误:'+error.message+'，请<a href='+link+'>重新绑定</a>'
            else
              _sina.users.show
                access_token:access_token
                uid:data.uid
                method:"get"
              ,(error,data)->
                if error 
                  res.send '绑定错误:'+error.message+'，请<a href='+link+'>重新绑定</a>'
                else
                  func_user.add {nick:data.screen_name,weibo_id:data.id,weibo_token:access_token,head_pic:data.profile_image_url},(error,user)->
                    if error
                      res.send '绑定错误:'+error.message+'，请<a href='+link+'>重新绑定</a>'
                    else
                      res.cookie '_p', user.id+":"+md5(user.weibo_token), 
                        expires: new Date(Date.now() + 1000*60*60*24*7)
                        httpOnly: true
                        domain:"html-js.com"
                      if not user.email
                        res.redirect '/user/email?'+querystring.stringify(req.query)
                        return
                      if req.query.mini
                        res.send '<script>parent.window.HtmlJS.util.logincallback&&parent.window.HtmlJS.util.logincallback()</script>'
                      else
                        res.redirect req.query.redirect||"/user"
                      sina.statuses.update 
                        access_token:res.locals.user.weibo_token
                        status:""
                  _sina.friendships.create {access_token:access_token,screen_name:"前端乱炖"},(error,info)->

  
module.exports.filters = {}
  