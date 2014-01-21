func_article = __F 'article/article'

module.exports = (req,res,next)->
  func_article.getAll 1,5,['publish_time>?',(new Date()).getTime()/1000-60*60*24*30],"visit_count desc",(error,articles)->
    res.locals.jian_hots = articles
    next()