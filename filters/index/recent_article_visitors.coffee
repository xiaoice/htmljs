func_article = __F 'article'
_ = require 'underscore'
module.exports = (req,res,next)->
  func_article.getVisitors null,60,(error,visitors)->
    visitors = _.uniq visitors,false,(r1,r2)->
    	console.log r2
    	return r1.user_id
    res.locals.article_visitors = visitors
    next()