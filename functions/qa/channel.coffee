Channel = new __BaseModel 'qa/channels'
Channel.sync()

func_channel = new __BaseFunction(Channel)
module.exports = func_channel
