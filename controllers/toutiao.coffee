Sina=require("./../lib/sdk/sina.js")
module.exports.controllers = 
  "/":
    get:(req,res,next)->

      res.render 'toutiao/index.jade'
    post:(req,res,next)->

      result = 
        success:0
        info:""
      
module.exports.filters = 
  "/":
    post:['checkLoginJson']