var func = function(name)
{
    func.names[name] = func.names[name] + 1 || 0;
    return name + func.names[name];
};
func.names = {};

module.exports = func;
