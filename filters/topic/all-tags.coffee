func_topic_tag = __F 'topic/tag'

module.exports =(req,res,next)->
  func_topic_tag.getAll 1,100,null,"id",(error,tags)->
    res.locals.tags = tags
    next()