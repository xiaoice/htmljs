func_column = __F 'column'
module.exports = (req,res,next)->
  res.locals.is_rssed = false
  if res.locals.user
    func_column.getUsersRss req.params.id,res.locals.user.id,(error,rss)->
      if rss
        res.locals.is_rssed = true
      next()
  else
    next()