func_user  =__F 'user'
module.exports = (req,res,next)->
  func_user.getById req.params.id,(error,user)->
    if error then next new Error '不存在的用户'
    else
      res.locals.who= user
      next()