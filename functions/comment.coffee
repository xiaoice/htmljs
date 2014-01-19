Comment = __M 'comments'
Comment.sync()
func_comment = 
  getAllByTargetId:(target_id,page,count,condition,order,callback)->
    if arguments.length == 5
      callback = order
      order = null
    query = 
      offset: (page - 1) * count
      limit: count
      order: order||"id desc"
      where:
        target_id:target_id
      raw:true
    if condition then query.where = condition
    Comment.findAll(query)
    .success (ms)->
      callback null,ms
    .error (e)->
      callback e
  getCommentByFilter:(filter,page,count,callback)->
    query = 
      offset: (page - 1) * count
      limit: count
      order: "id desc"
      where:["target_id like ?", "%"+filter+"%"]
      raw:true
    Comment.findAll(query)
    .success (ms)->
      callback null,ms
    .error (e)->
      callback e
__FC func_comment,Comment,['getAll','update','delete','getById','add']
module.exports = func_comment