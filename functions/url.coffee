Urls = new __BaseModel 'urls'
func = new __BaseFunction(Urls)
UUS = new __BaseModel 'uus'
UUS.sync()
Urls.sync()
func.addUUS = (data)->
  UUS.create(data)
func.getUUSById = (id,callback)->
  UUS.find
    where:
      id:id
  .success (uus)->
    callback null,uus
  .error (e)->
    callback e
func.getByPath = (path,callback)->
  Urls.find
    where:
      path:path
  .success (u)->
    callback null,u
  .error (e)->
    callback e
func.getByKey = (key,callback)->
  Urls.find
    where:
      key:key
  .success (u)->
    callback null,u
  .error (e)->
    callback e
module.exports = func