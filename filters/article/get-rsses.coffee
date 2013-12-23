func_column = __F 'column'
module.exports = (req,res,next)->
  func_column.getRsses req.params.id,(error,rsses)->
    res.locals.rsses = rsses
    next()
