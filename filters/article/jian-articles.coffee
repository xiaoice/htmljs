func_article = __F 'article/article'

module.exports = (req,res,next)->
  func_article.getAll 1,5,{is_jian:1},"id desc",(error,articles)->
    res.locals.jian_articles = articles
    next()