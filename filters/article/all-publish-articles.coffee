module.exports = (req,res,next)->
  if res.locals.user && !res.locals.user.is_admin
    condition = 
      is_yuanchuang:1
  else
    condition = null
  page = req.query.page || 1
  count = req.query.count || 20
  (__F 'article').count condition,(error,_count)->
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      (__F 'article').getAll page,count,condition,(error,articles)->
        if error then next error
        else
          res.locals.articles = articles
          next()