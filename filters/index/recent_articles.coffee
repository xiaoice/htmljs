func_article = __F 'article/article'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_article.getAll 1,10,{is_publish:1},(error,articles)->
    if error 
      console.log error
      
    res.locals.articles = articles
    next()