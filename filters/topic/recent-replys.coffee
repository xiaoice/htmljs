func_topic_comment = __F 'topic_comment'
module.exports = (req,res,next)->
  func_topic_comment.getAll 1,15,null,"id desc",(error,replys)->
    res.locals.recent_replys = replys
    next()