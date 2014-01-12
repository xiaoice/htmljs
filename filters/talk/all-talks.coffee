func_talk = __F 'talk/talk'
module.exports = (req,res,next)->
  page = req.query.page || 1
  count = req.query.count || 20

  func_talk.getAllAndCount page,count,null,"id desc",(error,_count,talks)->
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      res.locals.talks = talks
      next()