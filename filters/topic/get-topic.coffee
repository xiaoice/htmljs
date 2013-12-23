func_topic = __F 'topic'
module.exports = (req,res,next)->
  func_topic.getById req.params.id,(error,topic)->
    if error then next error
    else
      res.locals.topic = topic
      next()