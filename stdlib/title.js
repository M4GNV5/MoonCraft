var chat_message_array = require("./chat.js").chat_message_array;

exports.title = function()
{
    var msg = chat_message_array.apply(undefined, arguments);
    command("title @a title {0}".format(msg));
}

exports.subtitle = function()
{
    var msg = chat_message_array.apply(undefined, arguments);
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
