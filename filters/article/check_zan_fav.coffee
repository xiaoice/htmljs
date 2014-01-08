func_fav = __F 'user/fav'
func_article = __F 'article/article'
module.exports = (req,res,next)->
  if res.locals.article && res.locals.user
    #检查是否收藏过
    func_fav.getByUUIDAndUserId res.locals.article.uuid,res.locals.user.id,(error,fav)->
      if fav
        res.locals.has_fav = true
      func_article.getZanByArticleIdAndUserId res.locals.article.id,res.locals.user.id,(error,log)->
        if log
          res.locals.has_zan = true
        next()
  else
    next()
