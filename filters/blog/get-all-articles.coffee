func_article = __F 'blog/article'

module.exports = (req,res,next)->
  condition = null
  page = req.query.page || 1
  count = req.query.count || 20
  func_article.count condition,(error,_count)->
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      func_article.getAll page,count,condition,'time desc,id desc',(error,articles)->
        if error then next error
        else
          res.locals.articles = articles
          next()