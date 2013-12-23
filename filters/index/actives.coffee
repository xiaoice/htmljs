func_info = __F 'info'
module.exports = (req,res,next)->
  func_info.getAll 1,10,{type:[1,2,3,4,5,7,9]},"id desc",(error,infos)->
    res.locals.actives = infos
    next()