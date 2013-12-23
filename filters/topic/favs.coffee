func_fav = __F 'user/fav'

module.exports = (req,res,next)->
  func_fav.getByUUID res.locals.topic.uuid,(error,favs)->
    res.locals.favs = favs
    next()