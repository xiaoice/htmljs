ChannelUsers = new __BaseModel 'qa/channel_users'
ChannelUsers.sync()
Users = new __BaseModel 'users'
Users.hasOne ChannelUsers,{foreignKey:"user_id"}
ChannelUsers.belongsTo Users,{foreignKey:"user_id"}
func = new __BaseFunction(ChannelUsers)
func.getAll = (page,count,condition,order,include,callback)->
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
    raw:true
  if condition then query.where = condition
  query.include = [Users]
  ChannelUsers.findAll(query)
  .success (ms)->
    callback null,ms
  .error (e)->
    callback e
func.checkAlready = (channelId,userId,callback)->
  ChannelUsers.find
    where:
      channel_id:channelId
      user_id:userId
  .success (user)->
    if user
      callback new Error '已经加入过'
    else
      callback null
  .error (e)->
    callback e
module.exports = func 