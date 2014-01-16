func_user = __F 'user'
func_card = __F 'card'
func_info = __F 'info'
func_index = __F 'index'
func_fav = __F 'user/fav'
config = require './../config.coffee'
authorize=require("./../lib/sdk/authorize.js")
Sina=require("./../lib/sdk/sina.js")
func_bi = __F 'bi'
md5 = require 'MD5'
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
                      if req.query.mini
                        res.send '<script>parent.window.HtmlJS.util.logincallback&&parent.window.HtmlJS.util.logincallback()</script>'
                      else
                        res.redirect req.query.redirect||"/user"
  "/connet-card":
    post:(req,res,next)->
      result = 
        success:0
      if !res.locals.user
        result.info = "登录失效，请重新登录"
        res.send result
        return
      if res.locals.card
        result.info = "您已经关联过名片！"
        res.send result
        return
      func_user.connectCard res.locals.user.id,req.body.id,(error,user,card)->
        if error 
          result.info = error.message
        else
          result.success= 1
        res.send result
        if !error
          sina=new Sina(config.sdks.sina)
          sina.statuses.update 
            access_token:res.locals.user.weibo_token
            status:"我在@前端乱炖 的《前端花名册》认领了我的名片，这里是我的名片，欢迎收藏：http://www.html-js.com/user/"+res.locals.user.id
          (__F 'coin').add 40,res.locals.user.id,"创建了名片"
          func_index.add card.uuid
          
  "/update":
    post:(req,res,next)->
      result = 
        success:0
      func_card.update res.locals.card.id,req.body,(error,card)->
        if error
          result.info = error.message
        else
          result.success = 1
        res.send result
  "/coinhis":
    get:(req,res,next)->
      res.render 'user/coinhis.jade'
  "/bihis":
    get:(req,res,next)->
      result = 
        success:0
        info:''
      func_bi.getAll 1,10,{user_id:res.locals.user.id},"id desc",(error,his)->
        if error 
          result.info = error.message
        else
          result.data = his
          result.success = 1
        res.send result
  "/myarticles":
    get:(req,res,next)->
      res.render 'user/myarticles.jade'
  "/mytopics":
    get:(req,res,next)->
      res.render 'user/mytopic.jade'
  "/myqa":
    get:(req,res,next)->
      res.render 'user/myqa.jade'
  "/all-users":
    get:(req,res,next)->
      func_user.getAllNames (error,usernames)->
        res.send usernames
  "/fav":
    get:(req,res,next)->
      page = req.query.page || 1
      count = req.query.count || 30
      func_fav.count {user_id:res.locals.user.id},(error,_count)->
        if error then next error
        else
          res.locals.total=_count
          res.locals.totalPage=Math.ceil(_count/count)
          res.locals.page = (req.query.page||1)
          func_fav.getAll page,count,res.locals.user.id,(error,timelines)->
            if error then next error
            else
              res.locals.timelines = timelines
              res.render 'user/favs.jade'
    post:(req,res,next)->
      result = 
        success:0
        info:""
      func_fav.add
        user_id:res.locals.user.id
        info_id:req.body.uuid
      ,(error,fav)->
        if error
          result.info = error.message
        else
          result.success = 1
        res.send result
  "/":
    get:(req,res,next)->
      
      res.render 'user/index.jade'
  "/:id":
    get:(req,res,next)->
      res.locals.md5 = md5
      func_user.getById req.params.id,(error,user)->
        if error then next error
        else
          if not user then next new Error '不存在的用户'
          else
            res.locals.p_user = user
            if user.card_id
              res.redirect '/card/'+user.card_id
            else
              res.render 'user/p.jade'
    
module.exports.filters = 
  "/":
    get:['checkLogin',"checkCard",'card/visitors','user/infos','user/article-count','user/qa-count','user/topic-count']
  "/coinhis":
    get:['checkLogin',"checkCard",'card/visitors','user/coinhistories','user/article-count','user/qa-count','user/topic-count']
  "/bihis":
    get:['checkLoginJson']
  "/myarticles":
    get:['checkLogin',"checkCard",'card/visitors','user/myarticles','user/article-count','user/qa-count','user/topic-count']
  "/mytopics":
    get:['checkLogin',"checkCard",'card/visitors','user/mytopics','user/article-count','user/qa-count','user/topic-count']
  "/myqa":
    get:['checkLogin',"checkCard",'card/visitors','user/myqa','user/article-count','user/qa-count','user/topic-count']
  "/:id":
    get:['freshLogin']
  "/fav":
    get:['checkLogin']
    post:['checkLoginJson']
  "/connet-card":
    post:['checkLoginJson',"checkCard"]
  "/update":
    post:['checkLogin',"checkCard"]