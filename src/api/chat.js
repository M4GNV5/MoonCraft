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

        if(obj instanceof Entities.Selector)
            t.extra.push(new Chat.TellrawSelectorExtra(obj));
        else if(useExactTellraw && typeof obj.toExactTellrawExtra != 'undefined')
            t.extra = t.extra.concat(obj.toExactTellrawExtra());
        else if(typeof obj.toTellrawExtra != 'undefined')
            t.extra.push(obj.toTellrawExtra());
        else
            t.extra.push(new Chat.Message(obj.toString()));
    }

    t.tell(new Entities.Player("@a"));
}

var useExactTellraw = true;
cplApi.exactTellraw = function(enable)
{
    useExactTellraw = enable === false ? false : true;
}
