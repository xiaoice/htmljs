func_column = __F 'column'
module.exports = (req,res,next)->

  func_column.count {is_publish:1},(error,count)->
    if error then next error
    else
      res.locals.total=count
      res.locals.totalPage=Math.ceil(count/30)
      res.locals.page = (req.query.page||1)

      
    func_column.getAll res.locals.page,30,{is_publish:1},"last_article_time desc,visit_count desc",(if res.locals.user then res.locals.user.id else null),(error,columns)->
      if error then next error
      else
        res.locals.columns = columns
        next()