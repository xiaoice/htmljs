module.exports = (req,res,next)->
  (__F 'user').getAll 1,10,null,"coin desc",(error,users)->
    res.locals.top_users = users
    next()