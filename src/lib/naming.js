var names = {};

exports.next = function(name)
{
    names[name] = names[name] + 1 || 0;
    return name + names[name];
}
