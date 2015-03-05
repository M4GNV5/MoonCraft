var cplApi = cplApi || {};
var vars =  vars || {};

cplApi.log = function(message)
{
    api.log(message.toString());
}

cplApi.debugging = function(enabled)
{
    if(enabled !== false)
    {
        command("scoreboard objectives add std.integer dummy RuntimeInteger");
        command("scoreboard objectives setdisplay sidebar std.integer");
    }
    else
    {
        command("scoreboard objectives setdisplay sidebar");
    }
}

cplApi.out = function(variable)
{
    cplApi.tellraw("Output: ", variable);
}

cplApi.tellraw = function()
{
    var t = new Chat.Tellraw();

    for(var i = 0; i < arguments.length; i++)
    {
        var obj = vars[arguments[i]] || arguments[i];

        if(typeof obj.toTellrawExtra != 'undefined')
            t.extra.push(obj.toTellrawExtra());
        else
            t.extra.push(new Chat.Message(obj.toString()));
    }

    t.tell(new Entities.Player("@a"));
}

cplApi.setTimeout = function(callback, time)
{
    time = parseInt(time);

    if(callback instanceof Runtime.Callback)
        setTimeout(function() { callback.emit(); }, time);
    else if(typeof callback == 'function')
        setTimeout(callback, time);
    else
        throw "Invalid setTimeout callback '{0}'".format(callback);
}
