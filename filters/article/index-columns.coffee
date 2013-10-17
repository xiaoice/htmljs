func_column = __F 'column'
module.exports = (req,res,next)->
  func_column.getAll 1,100,{is_publish:1},"article_count desc,visit_count desc,zan_count desc",null,(error,columns)->
    res.locals.columns = columns
    next()