func_column = __F 'column'
func_article = __F 'article'
module.exports = (req,res,next)->
  console.log 'dd'
  condition = 
    is_yuanchuang:1
    user_id:res.locals.who.id
  page = req.query.page || 1
  count = req.query.count || 20
  (__F 'article').count condition,(error,_count)->

    if error then next error
    else if _count==0 then next new Error '这位大大还没有写过任何原创文章'
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      (__F 'article').getAll page,count,condition,(error,articles)->
        if error then next error
        else
          res.locals.articles = articles
          next()