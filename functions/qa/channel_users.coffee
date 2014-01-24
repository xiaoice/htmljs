ChannelUsers = new __BaseModel 'qa/channel_users'
ChannelUsers.sync()
Users = new __BaseModel 'users'
Users.hasOne ChannelUsers,{foreignKey:"user_id"}
ChannelUsers.belongsTo Users,{foreignKey:"user_id"}
func = new __BaseFunction(ChannelUsers)
func.getByChannelId = (channelId,callback)->
  ChannelUsers.findAll
    where:
      channel_id:channelId
      is_publish:1
    include:[Users]
  .success (users)->
    callback null,users
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