func_column = __F 'column'
module.exports = (req,res,next)->
  func_column.getAll res.locals.page,15,{is_publish:1},"last_article_time desc,visit_count desc",(error,columns)->
    if error then next error
    else
      res.locals.recent_columns = columns
      next()