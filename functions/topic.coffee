Topic = __M 'topics'
TopicComment = __M 'topic_comments'
User = __M 'users'
User.hasOne Topic,{foreignKey:"user_id"}
Topic.belongsTo User,{foreignKey:"user_id"}

Tag = __M 'topic/tags'
Tag.hasOne Topic,{foreignKey:"tag_id"}
Topic.belongsTo Tag,{foreignKey:"tag_id"}

Topic.sync()
TopicComment.sync()
func_topic = 
  getById:(id,callback)->
    Topic.find
      where:
        id:id
      raw:true
      include:[User,Tag]
      
    .success (topic)->
      if not topic then callback new Error '不存在的话题'
      else
        callback null,topic
    .error (e)->
      callback e
  getAll:(page,count,condition,order,include,callback)->
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
      include:[Tag]
      raw:true
    if condition then query.where = condition
    Topic.findAll(query)
    .success (ms)->
      callback null,ms
    .error (e)->
      callback e
__FC func_topic,Topic,['add','delete','update',"count","addCount"]
module.exports = func_topic