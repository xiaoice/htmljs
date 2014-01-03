module.exports = (req,res,next)->
  if not res.locals.card then next()
  else
    user_id = res.locals.card.user_id
    (__F 'topic').count {user_id:user_id},(error,count)->
      res.locals.his_topics_count = count
      (__F 'topic').getAll 1,10,{user_id:user_id},(error,topics)->
        res.locals.his_topics = topics
        next()