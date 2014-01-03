module.exports = (req,res,next)->
  condition = 
    user_id:res.locals.who.id
  if req.query.filter
    condition=condition||{}
   
  page = req.query.page || 1
  count = req.query.count || 20
  (__F 'question').count condition,(error,_count)->
    console.log _count
    if error then next error
    else
      res.locals.total=_count
      res.locals.totalPage=Math.ceil(_count/count)
      res.locals.page = (req.query.page||1)
      (__F 'question').getAllWithAnswer page,count,condition,"sort desc,id desc",(error,questions)->
        if error then next error
        else
          res.locals.questions = questions
          next()