func_tag = __F 'tag'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_tag.getAll 1,100,null,(error,tags)->
    res.locals.tags = tags
    next()