Talk = new __BaseModel 'talk/talk'
Talk.sync()

func_talk = new __BaseFunction(Talk)
module.exports = func_talk
