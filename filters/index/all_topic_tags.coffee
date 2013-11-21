func_tag = __F 'topic/tag'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_tag.getAll 1,100,null,(error,tags)->
    res.locals.topic_tags = tags
    next()