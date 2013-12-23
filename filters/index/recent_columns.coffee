func_column = __F 'column'

module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_column.getAll 1,20,null,"last_article_time desc",(error,columns)->
    res.locals.columns = columns
    next()