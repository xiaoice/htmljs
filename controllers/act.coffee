func_act = __F 'act'
config = require './../config.coffee'

Sina=require("./../lib/sdk/sina.js")
moment =require 'moment'
func_payment = __F 'payment'
func_search = __F 'search'
module.exports.controllers = 
  "/":
    get:(req,res,next)->
      page = req.params.page || 1
      count = 200000
      func_act.getAll page,count,{is_publish:1},(error,acts)->
        res.locals.acts = acts
        res.render 'act/index.jade'

  "/add":
    get:(req,res,next)->
      res.render 'act/add.jade'
    post:(req,res,next)->
      func_act.add req.body,(error,act)->
        if error then next error
        else
          func_search.add {"pid":act.uuid,"title":act.title,"html":act.desc_html.replace(/<[^>]*>/g,""),"udid":act.uuid,"id": act.id},()->
          res.redirect '/act'
  "/:id/edit":
    get:(req,res,next)->
      func_act.getById req.params.id,(error,act)->
        if error then next error
        else
          res.locals.act = act
          res.render 'act/add.jade'
    post:(req,res,next)->
      func_act.update req.params.id,req.body,(error,act)->
        if error then next error
        else
          res.redirect '/act'
  "/:id":
    get:(req,res,next)->
      func_act.getById req.params.id,(error,act)->
        if error then next error
        else
          res.locals.act = act
          func_act.addCount req.params.id,"visit_count",(error)->
            
          func_act.getAllJoiners req.params.id,(error,joiners)->
            res.locals.joiners = joiners ||[]
            res.render 'act/act.jade'
  "/u/:id":
    get:(req,res,next)->
      func_act.getByUUID req.params.id,(error,act)->
        if error then next error
        else
          res.locals.act = act
          func_act.addCount act.id,"visit_count",(error)->
            
          func_act.getAllJoiners act.id,(error,joiners)->
            res.locals.joiners = joiners ||[]
            res.render 'act/act.jade'
  "/:id/join":
    post:(req,res,next)->

      result = 
        success:0
      if !res.locals.card 
        result.info = '必须添加花名册并填写真实信息后才能报名，谢谢配合！'
        result.code = 101
        res.send result
        return
      else if not /[0-9]{11}/.test res.locals.card.tel
        result.info = '必须填写有效的手机号后才能报名，谢谢配合！'
        result.code = 102
        res.send result
        return
      func_act.getById req.params.id,(error,act)->
        if act.price 
          func_payment.add
            trade_num:uuid.v4().replace(/-/g,"")
            trade_title:"前端乱炖活动付费："+act.title
            target_uuid:act.id
            trade_price:act.price
            target_type:1
            target_user_id:res.locals.user.id
            need_address:act.need_address
          ,(error,payment)->
            if error 
              result.info = error.message
              res.send result
            else
              result.success = 1
              result.redirect = "/alipay/create?trade_num="+payment.trade_num
            res.send result
        else
          func_act.addJoiner req.params.id,res.locals.user,(error,joiner)->
            if error 
              result.info = error.message
              res.send result
            else
              func_act.getById req.params.id,(error,act)->
                if not error
                  sina=new Sina(config.sdks.sina)
                  str = ""
                  if act.share_text
                    str = act.share_text
                  else
                    str = "我在@前端乱炖 报名了【"+act.title+"】的活动，欢迎关注或者参与：http://www.html-js.com/act/"+act.id
                  sina.statuses.update 
                    access_token:res.locals.user.weibo_token
                    status:str
              
              result.success = 1
              result.data = joiner
              res.send result

module.exports.filters = 
  "/":
    get:['freshLogin']
  "/u/:id":
    get:['freshLogin','act/comments']
  "/:id":
    get:['freshLogin','act/comments']
  "/add":
    get:['checkLogin','checkAdmin']
    post:['checkLogin','checkAdmin']
  "/:id/edit":
    get:['checkLogin','checkAdmin']
    post:['checkLogin','checkAdmin']
  "/:id/join":
    post:['checkLoginJson','checkCard']