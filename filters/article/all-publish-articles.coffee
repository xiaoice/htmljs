module.exports = (req,res,next)->
  condition = 
    is_publish:1
    is_yuanchuang:1
  page = req.query.page || 1
  count = req.query.count || 20
  (__F 'article/article').count condition,(error,_count)->
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      (__F 'article/article').getAll page,count,condition,(error,articles)->
        if error then next error
        else
          res.locals.articles = articles
          next()