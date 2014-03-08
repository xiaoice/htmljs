Channel = new __BaseModel 'qa/channels'


Users = new __BaseModel 'users'

Channel.sync()
func_channel = new __BaseFunction(Channel)
func_channel.getAll = (page,count,condition,order,include,callback)->
  if arguments.length == 4
    callback = order
    order = null
    include = null
  else if arguments.length == 5
    callback = include
    include = null
  query = 
    offset: (page - 1) * count
    limit: count
    order: order || "id desc" 
  if condition then query.where = condition
  if include then query.include = include
  Channel.findAll(query)
  .success (ms)->
    callback null,ms
 
  .error (e)->
    callback e
module.exports = func_channel
