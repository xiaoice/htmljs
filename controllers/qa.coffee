func_question = __F 'question'
func_timeline = __F 'timeline'
func_answer = __F 'answer'
func_info = __F 'info'
func_topic = __F 'topic'
func_comment = __F 'comment'
pagedown = require("pagedown")
safeConverter = pagedown.getSanitizingConverter()
moment = require 'moment'
Sina=require("./../lib/sdk/sina.js")

module.exports.controllers = 
  "/":
    get:(req,res,next)->
      
      res.render 'qa/index.jade'
  "/add":
    get:(req,res,next)->
      res.render 'qa/add.jade'
    post:(req,res,next)->
      result = 
        success:0
      req.body.html = safeConverter.makeHtml req.body.md
      req.body.user_id = res.locals.user.id
      req.body.user_headpic = res.locals.user.head_pic
      req.body.user_nick = res.locals.user.nick
      func_question.add req.body,(error,q)->
        if error 
          result.info = error.message
        else
          result.success = 1
          (__F 'index').add q.uuid
          if req.body.tags
            func_question.addTagsToQuestion q.id,req.body.tags.split(",")
          (__F 'coin').add 20,res.locals.user.id,"发布了一条问题"
          func_timeline.add 
            who_id:res.locals.user.id
            who_headpic:res.locals.user.head_pic
            who_nick:res.locals.user.nick
            target_url:"/qa/"+q.id
            target_name:q.title
            action:"发起了一个提问："
            desc:q.html.replace(/<p>(.*?)<\/p>/g,"$1\n").replace(/<[^>]*?>/g,"").substr(0,300).replace(/([^\n])\n+([^\n])/g,"$1<br/>$2")
          if req.body.to_weibo
            sina=new Sina(__C.sdks.sina)
            sina.statuses.update 
              access_token:res.locals.user.weibo_token
              status:'我在@前端乱炖 发起了一个问题，求解答：【'+q.title+'】，点击查看或者回答问题：'+q.html.replace(/<[^>]*>/g,"").substr(0,130).replace(/\s/g,"")+''
            
        res.send result
  "/:id/comment":
    get:(req,res,next)->
      result = 
        success:0
      func_comment.getAllByTargetId "qa_"+req.params.id,1,20,null,(error,comments)->
        if error 
          result.info = error.message
        else
          result.comments = comments
          result.success = 1
        res.send result
    "post":(req,res,next)->
      result = 
        success:0
      func_answer.addComment req.params.id,res.locals.user.id,res.locals.user.nick,req.body.content,(error,comment)->
        if error 
          result.info = error.message
        else
          result.comment = comment.selectedValues
          result.comment.user = res.locals.user
          
          result.success = 1
        res.send result
  "/:id":
    "get":(req,res,next)->
      func_question.addCount req.params.id,'visit_count'
      res.render 'qa/qa.jade'
  "/:id/update":
    "get":(req,res,next)->
      func_question.update req.params.id,req.query,(error,question)->
        if error then next error
        else
          res.redirect 'back'
  "/answer/:id/update":
    "get":(req,res,next)->
      func_answer.update req.params.id,req.query,(error,question)->
        if error then next error
        else
          res.redirect 'back'
  "/:id/edit":
    "get":(req,res,next)->
      func_question.getById req.params.id,(error,question)->
        if error then next error
        else if not question then next new Error '不存在的问题'
        else
          
          res.locals.question = question
          res.render 'qa/edit-question.jade'
    "post":(req,res,next)->
      req.body.html = safeConverter.makeHtml req.body.md
      func_question.update req.params.id,req.body,(error,question)->
        if error 
          next error
        else
          if not req.body.reason then next new Error '必须填写修改原因'
          else
            func_question.addEditHistory question.id,res.locals.user.id,req.body.reason,(error,qeh)->
              func_info.add 
                target_user_id:question.user_id
                type:7
                source_user_id:res.locals.user.id
                source_user_nick:res.locals.user.nick
                time:new Date()
                target_path:"/qa/"+question.id
                action_name:"【修改】了您提问的问题"
                target_path_name:question.title
              if req.body.tags
                func_question.addTagsToQuestion question.id,req.body.tags.split(",")
              res.redirect '/qa/'+req.params.id
  "/answer/:id/edit":
    get:(req,res,next)->
      func_answer.getByIdWithQuestion req.params.id,(error,ans)->
        if error then next error
        else if not ans then next new Error '不存在的回答'
        else if !res.locals.user.is_admin && ans.user_id != res.locals.user.id then next new Error '没有权限，这不是您发布的回答'
        else
          res.locals.answer = ans
          res.render 'qa/edit-answer.jade'
    "post":(req,res,next)->
      req.body.html = safeConverter.makeHtml req.body.md
      func_answer.update req.params.id,req.body,(error)->
        if error 
          next error
        else
          func_question.getById req.body.question_id,(error,question)->
            if question
              func_info.add 
                target_user_id:question.user_id
                type:7
                source_user_id:res.locals.user.id
                source_user_nick:res.locals.user.nick
                time:new Date()
                target_path:"/qa/"+question.id+"#answer-"+req.params.id
                action_name:"【修改】了TA针对您问题的回答"
                target_path_name:question.title
                content:req.body.html
          res.redirect '/qa/'+req.body.question_id+"#answer-"+req.params.id
  "/answer/:id/comment":
    get:(req,res,next)->
      result = 
        success:0
      func_answer.getCommentsByAnswerId req.params.id,(error,comments)->
        if error 
          result.info = error.message
        else
          result.comments = comments
          result.success = 1
        res.send result
    "post":(req,res,next)->
      result = 
        success:0
      func_answer.addComment req.params.id,res.locals.user.id,res.locals.user.nick,req.body.content,(error,comment)->
        if error 
          result.info = error.message
        else
          result.comment = comment.selectedValues
          result.comment.user = res.locals.user
          
          result.success = 1
        res.send result
  "/answer/:id/zan":
    get:(req,res,next)->
      result = 
        success:0
      func_answer.getZan req.params.id,(error,his)->
        if error
          result.info = error.message
        else
          result.success = 1
          result.users = his.users
        res.send result
    post:(req,res,next)->
      result = 
        success:0
      func_answer.addZan req.params.id,res.locals.user,(error,ans)->
        if error
          result.info = error.message
        else
          (__F 'coin').add 5,ans.user_id,res.locals.user.nick+" 顶了你的回答"
          func_info.add 
            target_user_id:ans.user_id
            type:4
            source_user_id:res.locals.user.id
            source_user_nick:res.locals.user.nick
            time:new Date()
            target_path:"/qa/"+ans.question_id+"#answer-"+ans.id
            action_name:"【赞】了您的回答，获得 5 经验值"
            target_path_name:ans.md.substr(0,100)
          result.success = 1
          result.answer = ans
        res.send result
  "/:id/add":
    post:(req,res,next)->
      result = 
        success:0
      req.body.html = req.body.md
      req.body.user_id = res.locals.user.id
      req.body.user_headpic = res.locals.user.head_pic
      req.body.user_nick = res.locals.user.nick
      req.body.question_id = req.params.id
      func_answer.add req.body,(error,q,ans)->
        if error 
          result.info = error.message
        else
          result.success = 1
          func_info.add 
            target_user_id:q.user_id
            type:5
            source_user_id:res.locals.user.id
            source_user_nick:res.locals.user.nick
            time:new Date()
            target_path:"/qa/"+q.id
            action_name:"【回答】了您提问的问题"
            target_path_name:q.title
            content:req.body.html
        res.send result
  "/:question_id/good/:answer_id":
    get:(req,res,next)->
      func_question.update req.params.question_id,{good_answer_id:req.params.answer_id},(error,question)->
        if error then next error
        else
          func_answer.getById req.params.answer_id,(error,answer)->
            if answer
              (__F 'coin').add 20,answer.user_id,res.locals.user.nick+" 采纳了你的回答"
              func_info.add 
                target_user_id:answer.user_id
                type:9
                source_user_id:res.locals.user.id
                source_user_nick:res.locals.user.nick
                time:new Date()
                target_path:"/qa/"+question.question_id+"#answer-"+answer.id
                action_name:"【采纳】了你的回答，获得 20 经验值"
                target_path_name:answer.md.substr(0,100)
            res.redirect 'back'
  "/:question_id/move_to_topic":
    get:(req,res,next)->
      if !res.locals.user.is_admin
        next new Error '没有权限'
      else
        func_question.getById req.params.question_id,(error,question)->
          if error then next error
          else
            func_topic.add 
              title:question.title
              md:question.md
              html:question.html
              user_id:question.user_id
              user_nick:question.user_nick
              user_headpic:question.user_headpic
              last_comment_time:new Date()
              uuid:question.uuid
            ,(error,topic)->
              func_question.delete question.id,(error)->
                if error then next error
                else
                  res.redirect '/topic'
module.exports.filters = 
  "/":
    get:['freshLogin','qa/all-question','qa/hot-question','qa/recent-answers']
  "/add":
    get:['checkLogin','tag/all-tags']
    post:['checkLoginJson']
  "/:id/update":
    get:['checkLogin','checkAdmin']
  "/answer/:id/update":
    get:['checkLogin','checkAdmin']
  "/:id":
    get:['freshLogin','qa/get-question','qa/get-answers','qa/all-edit-history','qa/same-questions']
  "/:id/edit":
    get:['checkLogin','tag/all-tags']
    post:['checkLogin']
  "/answer/:id/edit":
    get:['checkLogin']
    post:['checkLogin']
  "/:id/add":
    post:['checkLoginJson']
  "/answer/:id/zan":
    post:['checkLoginJson']
  "/answer/:id/comment":
    post:['checkLoginJson']
  "/:question_id/good/:answer_id":
    get:['checkLogin']
  "/:question_id/move_to_topic":
    get:['checkLogin']