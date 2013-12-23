func_topic_tag = __F 'topic/tag'
func_topic = __F 'topic'
module.exports =(req,res,next)->
  func_topic_tag.getAll 1,100,null,"sort,id",(error,tags)->
    if error then next error
    else
      res.locals.tags = tags
      count = tags.length
      tags.forEach (tag)->
        console.log tag
        tag.topics = []
        func_topic.getAll 1,6,{tag_id:tag.id},"id desc",(error,topics)->
          if topics
            tag.topics = topics
          if (--count) == 0
            next()

      