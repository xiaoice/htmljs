Tag = __M 'topic/tags'
Tag.sync()

func_tag = {}

__FC func_tag,Tag,['add','delete','update','getAll','count']
module.exports = func_tag