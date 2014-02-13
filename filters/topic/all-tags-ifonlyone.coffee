func_topic_tag = __F 'topic/tag'
func_topic = __F 'topic'
module.exports =(req,res,next)->
  
  func_topic_tag.getAll 1,100,null,"sort,id",(error,tags)->
    if error then next error
    else
      res.locals.tags = tags
      if req.query.tag_id
        func_topic_tag.getById req.query.tag_id,(error,tag)->
          res.locals.tag = tag
          next()
      else
        next()

      