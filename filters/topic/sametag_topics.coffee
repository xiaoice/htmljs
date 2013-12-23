module.exports = (req,res,next)->
  (__F 'topic').getAll 1,10,{tag_id:res.locals.topic.tag_id},"sort desc,last_comment_time desc",(error,topics)->
    res.locals.sametag_topics = topics
    next()

