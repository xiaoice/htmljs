func_article = __F 'article'
module.exports = (req,res,next)->
  func_article.getAll 1,10,{is_publish:1},(error,articles)->
    res.locals.articles = articles
    next()