module.exports = (req,res,next)->
  if not res.locals.card then next()
  else
    user_id = res.locals.card.user_id
    (__F 'article/article').count {user_id:user_id,is_yuanchuang:1},(error,count)->
      res.locals.his_articles_count = count
      (__F 'article/article').getAll 1,10,{user_id:user_id,is_yuanchuang:1},(error,articles)->
        res.locals.his_articles = articles
        next()