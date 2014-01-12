Talk = new __BaseModel 'talk/talk'
Talk.sync()

func_talk = new __BaseFunction(Talk)
console.log func_talk
module.exports = func_talk
