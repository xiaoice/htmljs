func_column = __F 'column'
func_article = __F 'article/article'
module.exports = (req,res,next)->
  if res.locals.columns
    count = res.locals.columns.length
    res.locals.columns.forEach (column)->
      func_article.getAll 1,5,{column_id:column.id},"id desc",(error,articles)->
        if articles
          column.articles = articles
        if (--count) == 0
          next()
  else
    next()