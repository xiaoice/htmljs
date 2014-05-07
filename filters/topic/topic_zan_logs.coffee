func_topic = __F 'topic'
module.exports = (req,res,next)->
  func_topic.getZansByTopicId req.params.id,(error,zan_logs)->
    res.locals.zan_logs = zan_logs
    res.locals.zan_guo = false
    if zan_logs && res.locals.user
      zan_logs.forEach (log)->
        if log.user_id == res.locals.user.id
          res.locals.has_zan = true
    next()