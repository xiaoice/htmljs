func_topic = __F 'topic'
module.exports = (req,res,next)->
  page = req.query.page || 1
  count = req.query.count || 30
  func_topic.count {user_id:res.locals.user.id},(error,_count)->
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      func_topic.getAll page,count,{user_id:res.locals.user.id},(error,topics)->
        if error then next error
        else
          res.locals.topics = topics
          next()