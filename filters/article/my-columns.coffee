module.exports = (req,res,next)->
  if res.locals.user
    (__F 'column').getAll 1,100,{user_id:res.locals.user.id},"last_article_time desc,visit_count desc",(error,columns)->
      res.locals.my_columns = columns
      next()
  else
    res.locals.my_columns = []
    next()