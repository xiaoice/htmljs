pagedown = require("pagedown")
safeConverter =new pagedown.Converter()
pagedown.Extra.init(safeConverter);
func_topic = __F 'topic'
func_topic_comment = __F 'topic_comment'
func_info = __F 'info'
func_topic_tag = __F 'topic/tag'
func_user = __F 'user'
func_search = __F 'search'
moment = require 'moment'
module.exports.controllers = 
  "/":
    get:(req,res,next)->
      res.locals.page = req.query.page
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
        res.send result
  "/:id":
    get:(req,res,next)->
      res.locals.is_clear = req.query.is_clear 
      func_topic.addCount req.params.id,'visit_count'
      if res.locals.topic.tag_id
        func_topic_tag.addCount res.locals.topic.tag_id,'visit_count'
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
            if atname = req.body.md.match(/\@([^\s]*)/)
              atname = atname[1]
              func_user.getByNick atname,(error,user)->
                if user
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
module.exports.filters = 
  "/":
    get:['freshLogin','topic/all-tags','topic/all-topics','topic/recent-replys']
  "/add":
    get:['checkLogin','topic/all-tags']
    post:['checkLoginJson']
  "/:id":
    get:['freshLogin','topic/get-topic','topic/all-comments','topic/sametag_topics','topic/favs']
  "/:id/add":
    post:['checkLoginJson']
  "/:id/edit":
    get:['checkLogin','topic/all-tags']
    post:['checkLoginJson']