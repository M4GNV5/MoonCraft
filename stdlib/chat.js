exports.out = function(val)
{
    var val = val.toTellrawExtra ? val.toTellrawExtra() : JSON.stringify(val.toString());
    command("tellraw @a [\"Output: \",{0}]".format(val));
}

exports.create_message = function()
{
    var extras = [];
    for(var i = 0; i < arguments.length; i++)
        extras[i] = arguments[i].toTellrawExtra ? arguments[i].toTellrawExtra() : JSON.stringify(arguments[i].toString());

    return "[{0}]".format(extras.join(","));
}

exports.tellraw = function()
{
    var msg = exports.create_message.apply(exports, arguments);
    command("tellraw @a {0}".format(msg));
}



exports.title = function()
{
    var msg = exports.create_message.apply(exports, arguments);
    command("title @a title {0}".format(msg));
}

exports.subtitle = function()
{
    var msg = exports.create_message.apply(exports, arguments);
    command("title @a subtitle {0}".format(msg));
}

exports.title_clear = function()
{
    command("title @a clear");
}

exports.title_times = function(fadeIn, stay, fadeOut)
{
    fadeIn = parseInt(fadeIn) || 0;
    stay = parseInt(stay) || 1;
    fadeOut = parseInt(fadeOut) || 0;

    command("title @a times {0} {1} {2}".format(fadeIn, stay, fadeOut));
}

exports.title_reset = function()
{
    command("title @a reset");
}
