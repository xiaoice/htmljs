func_topic = __F 'topic'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_topic.getAll 1,16,null,"sort desc,id desc",(error,topics)->
    res.locals.topics = topics
    next()