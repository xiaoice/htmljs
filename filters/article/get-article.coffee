func_article = __F 'article'
module.exports = (req,res,next)->
  if /^[0-9]*$/.test(req.params.id)

    func_article.getById req.params.id,(error,article)->
      if error then next error
      else if not article then next new Error '不存在的文章'
      else
        res.locals.article = article
        next()
  else
    func_article.getByPinyin req.params.id,(error,article)->
      if error then next error
      else if not article then next new Error '不存在的文章'
      else
        req.params.id = article.id
        res.locals.article = article
        next()