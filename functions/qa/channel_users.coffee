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
    include:[Users]
  .success (users)->
    callback null,users
  .error (e)->
    callback e
module.exports = func 