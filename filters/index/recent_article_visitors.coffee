func_article = __F 'article'
_ = require 'underscore'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_article.getVisitors null,60,(error,visitors)->
    visitors = _.uniq (_.sortBy visitors),false,(r1,r2)->
    	return r1.user_id
    res.locals.article_visitors = visitors
    next()