func_talk = __F 'talk/talk'
module.exports.controllers = 
  "/":
    get:(req,res,next)->
      res.render 'talk/talk.jade'

module.exports.filters = 
  "/":
    get:['freshLogin','talk/all-talks']