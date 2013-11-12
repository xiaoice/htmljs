config = require("./../config.coffee")
path = require 'path'
Sequelize = require("sequelize")
uuid = require 'node-uuid'
# redis = require("redis")
# client = redis.createClient()
# client.on "error",  (err)->
#   console.log("redis error " + err)
# global.redis_client = client

global.sequelize = sequelize = new Sequelize(config.mysql_table, config.mysql_username, config.mysql_password,
  define:
    underscored: false
    freezeTableName: true
    charset: 'utf8'
    collate: 'utf8_general_ci'
  host:config.mysql_host
)
module.exports = global.__M= (modelName,defaultMethods)->
  obj = sequelize.define modelName.replace(/\//g,"_"), require path.join config.base_path,"models",modelName+config.script_ext
  return obj
global.uuid = require 'node-uuid'

global.__FC = (func,model,methods)->
  methods.forEach (m)->
    if m == 'getById'
      func.getById = (id,callback)->
        model.find
          where:
            id:id
        .success (m)->
          
          callback null,m
        .error (e)->
          callback e
    else if m == 'getAll'
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
        if condition then query.where = condition
        if include then query.include = include
        model.findAll(query)
        .success (ms)->
          callback null,ms
        .error (e)->
          callback e
    else if m == 'add'
      func.add = (data,callback)->
        data.uuid = uuid.v4()
        model.create(data)
        .success (m)->
          callback&&callback null,m
        .error (error)->
          callback&&callback error
    else if m == "update"
      func.update = (id,data,callback)->
        model.find
          where:
            id:id
        .success (m)->
          if m
            m.updateAttributes(data)
            .success ()->
              callback&&callback null,m
            .error (error)->
              callback&&callback error
        .error (error)->
          callback&&callback error
    else if m == "count"
      func.count = (condition,callback)->
        query={}
        if condition then query.where = condition
        model.count(query)
        .success (count)->
          callback null,count
        .error (e)->
          callback e
    else if m == 'delete'
      func.delete = (id,callback)->
        model.find
          where:
            id:id
        .success (m)->
          if not m then callback new Error '不存在'
          else
            m.destroy()
            .success ()->
              callback&&callback null,m
            .error (error)->
              callback&&callback error
        .error (error)->
          callback&&callback error
    else if m == 'addCount'
      func.addCount = (id,field,callback)->
        model.find
          where:
            id:id
        .success (m)->
          if m
            updates = {}
            updates[field]=m[field]*1+1
            m.updateAttributes(updates)
            .success ()->
              callback&&callback null,m
            .error (error)->
              callback&&callback error
        .error (error)->
          callback&&callback error
  # wrapper = {}
  # for k,v of func
  #   ((i)-> 
  #     wrapper[i]= ()->
  #       args = []
  #       argstr = []
  #       cache_key = ""
  #       _arguments = arguments
  #       if func.path
  #         func_path = func.path.replace(__C.base_path,"")+"/"+i
  #         for e in arguments
  #           args.push e
  #           if e && typeof e != 'function'
  #             argstr.push e.toString().replace(/\s/g,"")
  #         cache_key = func_path+argstr.join("-")
  #         if __C.cache.indexOf func_path !=0
  #           # client.set(func_path+arguments.join("-"))
  #           args[args.length-1]=()->
  #             client.set(cache_key,JSON.stringify(arguments[1]))
  #             _arguments[_arguments.length-1].apply(this,arguments)
  #           client.get cache_key,(error,value)->
  #             if value
  #               datas = JSON.parse value
  #               console.log datas
  #               _arguments[_arguments.length-1].call(this,null,datas)
  #               console.log "from redis"
  #             else
  #               func[i].apply(this,args)
  #           return;
  #       func[i].apply(this,args)
  #   )(k)
    
  # return wrapper
  return func
