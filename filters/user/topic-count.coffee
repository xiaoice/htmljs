func_topic = __F 'topic'
module.exports = (req,res,next)->
  func_topic.count {user_id:res.locals.user.id},(error,_count)->
    res.locals.topic_count =_count
    next()