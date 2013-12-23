module.exports = (req,res,next)->
  if res.locals.card
    (__F 'column').getAll 1,100,{user_id:res.locals.card.user_id},(error,columns)->
      res.locals.my_columns = columns
      next()
  else
    res.locals.my_columns = []
    next()