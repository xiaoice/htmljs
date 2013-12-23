func_fav = __F 'user/fav'

module.exports = (req,res,next)->
  func_fav.getByUUID res.locals.article.uuid,(error,favs)->
    res.locals.favs = favs
    next()