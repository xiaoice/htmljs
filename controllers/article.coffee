func_user = __F 'user'
func_article = __F 'article'
func_info = __F 'info'
func_timeline = __F 'timeline'
func_column = __F 'column'
func_card = __F 'card'
func_bi = __F 'bi'
func_email = __F 'email'
func_search = __F 'search'
config = require './../config.coffee'
authorize=require("./../lib/sdk/authorize.js");
md5 = require 'MD5'
Sina=require("./../lib/sdk/sina.js")
sina=new Sina(config.sdks.sina)
pagedown = require("pagedown")
safeConverter = new pagedown.Converter()
console.log pagedown.Converter.Extra
pagedown.Extra.init(safeConverter);
read = require("readability")
request = require 'request'
rss = require 'rss'
module.exports.controllers = 
  "/":
    "get":(req,res,next)->
      
      res.render 'article/articles.jade'

  "/old":
    "get":(req,res,next)->
      condition = 
        is_yuanchuang:1
        column_id:null
      func_article.count condition,(error,count)->
        if error then next error
        else
          res.locals.total=count
          res.locals.totalPage=Math.ceil(count/20)
          res.locals.page = (req.query.page||1)
          func_article.getAll res.locals.page,20,condition,(error,articles)->
            if error then next error
            else
              res.locals.articles = articles
              res.render 'articles.jade'
  
  "/add/recommend":
    "get":(req,res,next)->
      res.render 'add-recommend.jade'
    "post":(req,res,next)->
      
      data = 
        html:req.body.html
        title:req.body.title
        type:2
        quote_url:req.body.quote_url
        user_id:res.locals.user.id
        user_nick:res.locals.user.nick
        user_headpic:res.locals.user.head_pic
        publish_time:new Date().getTime()/1000
      result = 
        success:0
      func_article.add data,(error,article)->
        if error 
          result.info = error.message
        else
          result.success = 1
          func_timeline.add 
            who_id:res.locals.user.id
            who_headpic:res.locals.user.head_pic
            who_nick:res.locals.user.nick
            target_url:"/read/"+article.id
            target_name:article.title
            action:"收藏了文章："
            desc:article.html.replace(/<p>(.*?)<\/p>/g,"$1\n").replace(/<[^>]*?>/g,"").substr(0,200).replace(/([^\n])\n+([^\n])/g,"$1<br/>$2")
        res.send result
  "/online_to_local":
    "post":(req,res,next)->
      url = req.body.url.replace(/#.*$/,"") #替换掉符号后的字符
      result = 
        success:0
        info:""
      #先查找数据中是否已经存在
      func_article.getByUrl url,(error,art)->
        if art
          result.data = art
          result.success = 1
          res.send result
        else
          request.get url,(e,s,entry)->
            if e 
              result.info = e.message
              res.send result
            else
              read.parse entry,"",(parseResult)->
                titlematch = entry.match(/<title>(.*?)<\/title>/)
                t = ""
                if titlematch then t=titlematch[1] 
                result.data= 
                  url:url
                  title:(if parseResult.title then parseResult.title else t).replace(/^\s*|\s*$/,"")
                  content:parseResult.content
                  desc:parseResult.desc
                  real_url:s.request.href
                  is_publish:0
                result.success = 1
                result.is_realtime = 1 #表示是实时抓取而不是从数据库提取的
                res.send result
  "/online_to_storage":
    "post":(req,res,next)->
      url = req.body.url.replace(/#.*$/,"") #替换掉符号后的字符
      result = 
        success:0
        info:""
      #先查找数据中是否已经存在
      func_article.getByUrl url,(error,art)->
        if art
          result.data = art
          result.success = 1
          res.send result
        else
          request.get url,(e,s,entry)->
            if e 
              result.info = e.message
              res.send result
            else
              read.parse entry,"",(parseResult)->
                titlematch = entry.match(/<title>(.*?)<\/title>/)
                t = ""
                if titlematch then t=titlematch[1] 
                data= 
                  quote_url:url
                  title:(if parseResult.title then parseResult.title else t).replace(/^\s*|\s*$/,"")
                  html:parseResult.content
                  desc:parseResult.desc
                  is_publish:0
                  is_yuanchuang:0
                func_article.add data,(error,art)->
                  result.data = art;
                  result.success = 1
                  result.is_realtime = 1 #表示是实时抓取而不是从数据库提取的
                  res.send result
  "/add":
    "get":(req,res,next)->
      if not res.locals.card then next new Error '必须添加花名册后才能发表专栏文章！',100
      res.locals.column_id = if req.query.column_id then req.query.column_id else ""
      res.render 'add-article.jade'
    "post":(req,res,next)->
      html = safeConverter.makeHtml req.body.md
      match = html.match(/<img[^>]+?src="([^"]+?)"/)
      data = 
        md:req.body.md
        html:html
        title:req.body.title
        type:req.body.type
        user_id:res.locals.user.id
        user_nick:res.locals.user.nick
        column_id:req.body.column_id
        user_headpic:res.locals.user.head_pic
        publish_time:new Date().getTime()/1000
        is_yuanchuang:1
        is_publish:1
        main_pic:if match then match[1] else null
        desc:req.body.desc
      
      result = 
        success:0
      func_article.add data,(error,article)->
        if error 
          result.info = error.message
        else
          result.success = 1
          (__F 'index').add article.uuid
          (__F 'coin').add 40,article.user_id,"发表了一篇专栏文章"
          if req.body.column_id
            func_column.update req.body.column_id,{last_article_time:(new Date()).getTime()},()->
            func_column.addCount req.body.column_id,"article_count",(error)->
            func_column.getRsses req.body.column_id,(error,rsses)->
              if rsses && rsses.length>0
                emails = []
                rsses.forEach (rss)->
                  if rss.cards&&rss.cards.email
                    emails.push rss.cards.email
                func_email.sendArticleRss article,emails.join(";")
          sina.statuses.update 
            access_token:res.locals.user.weibo_token
            status:'我在@前端乱炖 发表了一篇原创文章【'+article.title+'】点击查看：http://www.html-js.com/article/'+article.id
          func_search.add {type:"article","pid":article.uuid,"title":article.title,"html":article.html.replace(/<[^>]*>/g,""),"udid":article.uuid,"id": article.id},()->
        res.send result
  "/:id/edit":
    "get":(req,res,next)->
      func_article.getById req.params.id,(error,article)->
        if error then next error
        else if res.locals.user.is_admin!=1 && article.user_id != res.locals.user.id then next new Error '没有权限编辑此文章'
        else
          res.locals.article = article
          res.render 'add-article.jade'
    "post":(req,res,next)->
      html = safeConverter.makeHtml req.body.md
      match = html.match(/<img[^>]+?src="([^"]+?)"/)
      data = 
        md:req.body.md
        html:html
        title:req.body.title
        publish_time:new Date().getTime()/1000
        main_pic:if match then match[1] else null
        desc:safeConverter.makeHtml req.body.md.substr(0,600)
        column_id:req.body.column_id
      result = 
        success:0
      func_article.update req.params.id,data,(error,article)->
        if error 
          result.info = error.message
        else
          result.success = 1
        res.send result
  "/:id/update":
    get:(req,res,next)->
      func_article.update req.params.id,req.query,(error,article)->
        if error then next error
        else
          res.redirect 'back'
  "/:id/delete":
    get:(req,res,next)->
      func_article.delete req.params.id,(error,article)->
        if error then next error
        else
          func_bi.add 
            user_id:article.user_id
            count:__C.bi.article*-1
            day:(new Date()).getTime()/1000*60*60*24
            reason:"文章被删除"
            from_title:null
            from_user_nick:"管理员"
          ,()->
          res.redirect 'back'
  "/:id/zan":
    post:(req,res,next)->
      result = 
        success:0
      func_article.addZan req.params.id,res.locals.user.id,req.body.score,(error,log,article)->
        if error 
          result.info = error.message
        else
          result.success = 1
          func_info.add 
            target_user_id:article.user_id
            type:1
            source_user_id:res.locals.user.id
            source_user_nick:res.locals.user.nick
            time:new Date()
            target_path:"/article/"
            action_name:"【赞】了您的原创文章()"+req.body.score+")"
            target_path_name:article.title
        res.send result
  "/:id/create_pic":
    get:(req,res,next)->
      (__F 'create_thumbnail').create_article req.params.id
      res.redirect 'back'
  "/column":
    get:(req,res,next)->
      res.render 'article/columns.jade'
  "/:id":
    "get":(req,res,next)->
      article = res.locals.article
      
      func_card.getByUserId article.user_id,(error,card)->
        if card 
          article.card = card
        # if article.user_id && res.locals.user
        #   func_info.add 
        #     target_user_id:article.user_id
        #     type:1
        #     source_user_id:res.locals.user.id
        #     source_user_nick:res.locals.user.nick
        #     time:new Date()
        #     target_path:req.originalUrl
        #     action_name:"【访问】了您的原创文章"
        #     target_path_name:article.title
        res.locals.article = article
        func_article.addVisit req.params.id,res.locals.user||null
        if article.column_id
          func_column.addCount article.column_id,"visit_count",()->
        if req.query.is_clear 
          res.render 'article/clear-article.jade'
        else
          res.render 'article.jade'
  
  "/column/add":
    get:(req,res,next)->

      if not res.locals.card
        next new Error '必须添加“花名册”后才能添加自己的专栏'

      res.render 'article/add-column.jade'
    post:(req,res,next)->
      if not res.locals.card
        next new Error '必须添加“花名册”后才能添加自己的专栏'
      if not req.body.desc_md 
        next new Error '必须填写简介'
      req.body.desc_html = safeConverter.makeHtml req.body.desc_md
      req.body.user_id = res.locals.user.id
      req.body.is_publish = 1
      
      func_column.add req.body,(error,column)->
        if error then next error
        else 
          func_info.add 
            target_user_id:1
            type:8
            source_user_id:res.locals.user.id
            source_user_nick:res.locals.user.nick
            time:new Date()
            target_path:'/article/column/'+column.id
            action_name:"请求开通专栏"
            target_path_name:column.name
          res.redirect '/article/column/'+column.id
  "/column/:id":
    get:(req,res,next)->
      condition = 
        is_yuanchuang:1
        column_id:req.params.id

      func_article.count condition,(error,count)->
        if error then next error
        else
          res.locals.total=count
          res.locals.totalPage=Math.ceil(count/20)
          res.locals.page = (req.query.page||1)
          func_article.getAll res.locals.page,20,condition,(error,articles)->
            if error then next error
            else
              res.locals.articles = articles
              res.render 'articles.jade'
  "/column/:id/rss":
    get:(req,res,next)->
      if not res.locals.card then next new Error '请先添加花名册并且填写正确的邮箱地址才能使用此功能！'
      else if not res.locals.card.email then next new Error '请先添加花名册并且填写正确的邮箱地址才能使用此功能！'
      else
        func_column.addRss req.params.id,res.locals.user.id,(error,rss)->
          if error then next error
          else
            func_column.getById req.params.id,(error,column)->
              if column
                func_info.add 
                  target_user_id:column.user_id
                  type:10
                  source_user_id:res.locals.user.id
                  source_user_nick:res.locals.user.nick
                  time:new Date()
                  target_path:'/article/column/'+column.id
                  action_name:"订阅了您的专栏"
                  target_path_name:column.name
            func_column.checkNotify req.params.id
            res.redirect 'back'
    post:(req,res,next)->
      result = 
        success:0
        info:""
      if !res.locals.card
        result.info = '请先添加花名册并且填写正确的邮箱地址才能使用此功能！'
        res.send result
      else if not res.locals.card.email 
        result.info = '请先添加花名册并且填写正确的邮箱地址才能使用此功能！'
        res.send result
      else
        func_column.addRss req.params.id,res.locals.user.id,(error,rss)->
          if error 
            result.info = error.message
            res.send result
          else
            func_column.getById req.params.id,(error,column)->
              if column
                func_info.add 
                  target_user_id:column.user_id
                  type:10
                  source_user_id:res.locals.user.id
                  source_user_nick:res.locals.user.nick
                  time:new Date()
                  target_path:'/article/column/'+column.id
                  action_name:"订阅了您的专栏"
                  target_path_name:column.name
            func_column.checkNotify req.params.id
            result.success = 1
            res.send result
module.exports.filters = 
  "/add":
    get:['checkLogin',"checkCard","article/all-pub-columns"]
    post:['checkLoginJson',"checkCard"]
  "/:id/edit":
    get:['checkLogin',"checkCard","article/all-pub-columns"]
    post:['checkLoginJson',"checkCard"]
  "/add/recommend":
    get:['checkLogin',"checkCard"]
    post:['checkLoginJson',"checkCard"]
  
  "/":
    get:['freshLogin','get_infos','article/new-comments','article/my-columns','article/recent-columns','article/all-publish-articles']
  "/old":
    get:['freshLogin','getRecent','get_infos','article/new-comments']
  "/:id":
    get:['freshLogin','getRecent','get_infos','article/get-article','article/get-article-column','article/this-column','article/comments','article/article_zan_logs','article/favs']
  "/:id/zan":
    post:['checkLoginJson']
  "/column":
    get:['freshLogin','getRecent','get_infos','article/new-comments','article/my-columns','article/index-columns','article/checkRss']
  "/column/add":
    get:['checkLogin',"checkCard"]
    post:['checkLogin',"checkCard"]
  "/column/:id":
    get:['freshLogin','getRecent','get_infos','article/new-comments','article/recent-columns',"article/get-column",'article/get-column-rss','article/get-rsses']
  "/column/:id/rss":
    get:['checkLogin','checkCard']
    post:['checkLoginJson','checkCard']
  "/:id/update":
    get:['checkLogin','checkAdmin']
  "/:id/delete":
    get:['checkLogin','checkAdmin']



