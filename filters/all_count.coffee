all_count = __F 'all_count'

module.exports = (req,res,next)->
  console.log all_count.data
  res.locals.all_count = all_count.getData()
  next()