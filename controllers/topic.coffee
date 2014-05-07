pagedown = require("pagedown")
safeConverter =new pagedown.Converter()
pagedown.Extra.init(safeConverter);
func_topic = __F 'topic'
func_topic_comment = __F 'topic_comment'
func_info = __F 'info'
func_topic_tag = __F 'topic/tag'
func_user = __F 'user'
func_search = __F 'search'
config = require './../config.coffee'
Sina=require("./../lib/sdk/sina.js")
sina=new Sina(config.sdks.sina)
moment = require 'moment'
module.exports.controllers = 
  "/":
    get:(req,res,next)->
      res.locals.now_page = req.query.page
      res.render 'topic/index.jade'

  "/add":
    get:(req,res,next)->
      res.locals.tag_id = req.query.tag_id
      res.render 'topic/add.jade'

    post:(req,res,next)->
      result = 
        success:0
      req.body.html = safeConverter.makeHtml req.body.md
      req.body.user_id = res.locals.user.id
      req.body.user_headpic = res.locals.user.head_pic
      req.body.user_nick = res.locals.user.nick
      req.body.last_comment_time = new Date()
      func_topic.add req.body,(error,topic)->
        if error 
          result.info = error.message
        else
          result.success = 1
          (__F 'index').add topic.uuid
          (__F 'coin').add 20,res.locals.user.id,"发布了一个话题"
          func_search.add {type:"topic","pid":topic.uuid,"title":topic.title,"html":topic.html.replace(/<[^>]*>/g,""),"udid":topic.uuid,"id": topic.id},()->
          if req.body.tag_id
            func_topic_tag.addCount req.body.tag_id,'topic_count'
          (__F 'create_thumbnail').create_topic topic.id,()->
            sina.statuses.upload 
              access_token:res.locals.user.weibo_token
              pic:(require 'path').join __dirname,"../uploads/article_thumb/topic-"+topic.id+".png"
              status:'我在@前端乱炖 发起了一个话题《'+topic.title+'》点击查看：http://www.html-js.com/topic/'+topic.id+"  。前端乱炖是一个专业的前端原创内容社区"
        res.send result
  "/:id":
    get:(req,res,next)->
      res.locals.is_clear = req.query.is_clear 
      func_topic.addCount req.params.id,'visit_count',(()->),2
      if res.locals.topic.tag_id
        func_topic_tag.addCount res.locals.topic.tag_id,'visit_count',(()->),2
      res.render 'topic/topic.jade'
  "/:id/edit":
    get:(req,res,next)->
      func_topic.getById req.params.id,(error,topic)->
        if error then next error
        else
          res.locals.topic = topic
          res.render 'topic/edit.jade'
    post:(req,res,next)->
      result = 
        success:0
      req.body.html = safeConverter.makeHtml req.body.md
      func_topic.update req.params.id,req.body,(error,topic)->
        if error 
          result.info = error.message
        else
          result.success = 1
        res.send result     
  "/:id/add":
    post:(req,res,next)->
      result = 
        success:0
      req.body.html = safeConverter.makeHtml req.body.md
      req.body.user_id = res.locals.user.id
      req.body.user_headpic = res.locals.user.head_pic
      req.body.user_nick = res.locals.user.nick
      req.body.topic_id = req.params.id
      func_topic_comment.getLast req.params.id,res.locals.user.id,(error,c)->
        if c
          console.log moment(c.createdAt).valueOf()
          console.log new Date()
          if (new Date()).getTime()-moment(c.createdAt).valueOf() <20000
            result.info = '跟帖间隔不能小于20秒'
            res.send result
            return
        func_topic_comment.add req.body,(error,comment,topic)->
          if error 
            result.info = error.message
          else
            result.success = 1
            topic.updateAttributes
              last_comment_time:new Date()
              last_comment_user_id:res.locals.user.id
              last_comment_user_nick:res.locals.user.nick
              comment_count:topic.comment_count*1+1
            (__F 'coin').add 1,res.locals.user.id,"发布了一个话题的跟帖"
            func_info.add 
              target_user_id:topic.user_id
              type:5
              source_user_id:res.locals.user.id
              source_user_nick:res.locals.user.nick
              time:new Date()
              target_path:"/topic/"+topic.id
              action_name:"【回复】了您的话题"
              target_path_name:topic.title
              content:req.body.html
            if atnames = req.body.md.match(/\@([^\s]*)/g)
              atcount = atnames.length
              html = req.body.html
              console.log atnames
              atnames.forEach (atname)->
                atname = atname.replace("@","")
                func_user.getByNick atname,(error,user)->
                  atcount--
                  if user
                    html = html.replace("@"+atname,"<a href='/user/"+user.id+"'>@"+atname+"</a>")
                    if atcount==0
                      func_topic_comment.update comment.id,{html:html}
                    func_info.add 
                      target_user_id:user.id
                      type:6
                      source_user_id:res.locals.user.id
                      source_user_nick:res.locals.user.nick
                      time:new Date()
                      target_path:"/topic/"+topic.id
                      action_name:"在回帖中【提到】了你"
                      target_path_name:topic.title
                      content:req.body.html
          res.send result
  
  "/comment/:id/zan":
    post:(req,res,next)->
      func_topic_comment.addCount req.params.id,"zan_count",()->
        res.send({success:1})
      if res.locals.user
        func_topic_comment.getById req.params.id,(error,comment)->
          func_info.add 
            target_user_id:comment.user_id
            type:4
            source_user_id:res.locals.user.id
            source_user_nick:res.locals.user.nick
            time:new Date()
            target_path:"/topic/"+comment.topic_id
            action_name:"【赞】了您的跟帖"
            target_path_name:comment.html.replace(/<.*?>/g,"")
  "/:id/zan":
    post:(req,res,next)->
      result = 
        success:0
      if res.locals.user.is_admin
        func_topic.addCount req.params.id,"zan_count"
      func_topic.addZan req.params.id,res.locals.user.id,req.body.score,(error,log,article)->
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
            target_path:"/topic/"
            action_name:"【赞】了您发起的话题"
            target_path_name:article.title
        res.send result
module.exports.filters = 
  "/":
    get:['freshLogin','topic/all-tags-ifonlyone','topic/all-topics','topic/recent-replys']
  "/add":
    get:['checkLogin','topic/all-tags']
    post:['checkLoginJson']
  "/:id":
    get:['freshLogin','topic/get-topic','topic/all-comments','topic/sametag_topics','topic/favs','book/some-books','topic/topic_zan_logs']
  "/:id/add":
    post:['checkLoginJson']
  "/:id/zan":
    post:['checkLoginJson']
  "/:id/edit":
    get:['checkLogin','topic/all-tags']
    post:['checkLoginJson']
  "/comment/:id/zan":
    post:['freshLogin']