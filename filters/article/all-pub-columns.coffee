module.exports = (req,res,next)->
  (__F 'column').count ["is_publish = 1 and user_id = ?", res.locals.user.id],(error,count)->
    res.locals.private_columns_count = count
    (__F 'column').getAll 1,100,["is_publish = 1 and user_id = ? or is_public = 1", res.locals.user.id],null,null,(error,columns)->
      res.locals.columns = columns
      next()