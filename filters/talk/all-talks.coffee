func_talk = __F 'talk/talk'
module.exports = (req,res,next)->
  page = req.query.page 
  count = req.query.count || 20

  func_talk.count null,(error,_count)->
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      page = page||res.locals.totalPage
      res.locals.page = (page||1)
      func_talk.getAll res.locals.totalPage-page+1,count,null,"id desc",(error,talks)->
        if error then next error
        else
          res.locals.talks = talks
          next()