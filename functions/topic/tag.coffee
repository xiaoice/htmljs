Tag = __M 'topic/tags'
Tag.sync()
Topic = __M 'topics'
Topic.belongsTo Tag,{foreignKey:"tag_id"}
Tag.hasMany Topic,{foreignKey:"tag_id"}
func_tag = 
  getAllWithTopic:(page,count,condition,order,include,callback)->
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
      include:[Topic]
    if condition then query.where = condition
    if include then query.include = include
    Tag.findAll(query)
    .success (ms)->
      callback null,ms
    .error (e)->
      callback e

__FC func_tag,Tag,['getById','add','delete','update','getAll','count','addCount']
module.exports = func_tag