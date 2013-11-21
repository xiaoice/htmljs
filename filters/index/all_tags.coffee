func_tag = __F 'tag'
module.exports = (req,res,next)->
  func_tag.getAll 1,100,null,(error,tags)->
    res.locals.tags = tags
    next()