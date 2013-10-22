module.exports = (req,res,next)->
  (__F 'column').getAllWithArticle 1,100,["is_publish = 1 and user_id = ? or is_public = 1", res.locals.user.id],null,null,(error,columns)->
    res.locals.columns = columns
    next()