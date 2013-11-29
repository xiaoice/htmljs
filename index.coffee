express        = require("express")
http           = require("http")
path           = require("path")
config         = require './config.coffee'
rainbow        = require './lib/rainbow.js'
lessmiddle     = require 'less-middleware'
less           = require 'less'
module.exports = app = express()
log4js = require('log4js')
log4js.configure({
  appenders: [
    { type: 'console' }
#    {
#      type: 'file'
#      filename: 'logs/access.log'
#      maxLogSize: 1024
#      backups:3
#      category: 'normal' 
#    }
  ]
})
logger = log4js.getLogger('normal')
logger.setLevel('INFO')
black = ['DNSPod','monitor','snarfware']
_ = require 'underscore'
app.configure ->
  app.set "port", config.run_port
  app.set "views", path.join __dirname, 'views'
  app.set "view engine", "jade"
  app.use express.favicon()
  app.use "/assets",lessmiddle({src:__dirname+"/assets",compress:true})
  app.use "/assets", express.static(__dirname+"/assets")
  app.use "/uploads", express.static(__dirname+"/uploads")
 
#  app.use express.logger("dev")
  app.use express.bodyParser()
  app.use express.cookieParser()
  app.use express.cookieSession(secret: 'fd2afdsafdvcxzjaklfdsa')
  app.use express.methodOverride()
  app.use(log4js.connectLogger(logger, {level:log4js.levels.INFO}))
  app.locals.assets_head = config.assets_head
  app.use (req,res,next)->
    res.locals.url = req.url
    agent = req.get("user-agent")
    if agent == ""
      res.end ' hello robot 1'
      return
    for i in [0...black.length]
      if agent.indexOf(black[i]) != -1
        res.end ' hello robot 2'
        return
    next()
  app.use app.router
  rainbow.route(app, {  
    controllers: '/controllers/',
    filters:'/filters/',      
    template:'/views/'   
  })
  #require('./alipay_config').alipay.route(app);
  app.all "*",(req, res, next)->
    res.render '404.jade',{status: 404},(error,page)->
      res.send page,404
  app.use (err, req, res, next)->
    res.render 'error.jade'
      error:err.message
      code:err.code
  
  app.locals.moment= require 'moment'
  app.locals.moment.lang('zh-cn');
  app.locals.assets_head = config.assets_head
  app.locals.assets_tm = "8-23"
app.configure "development", ->
  app.use express.errorHandler()