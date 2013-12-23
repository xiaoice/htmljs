func_card = __F 'card'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_card.getAll 1,13,null,'createdAt desc',(error,cards)->
    if error 
      console.log error
      
    res.locals.cards = cards
    next()