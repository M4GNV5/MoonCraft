var cplApi = {};

cplApi.out = function(variable)
{
    var t = new Chat.Tellraw("Output: ");
    if(typeof variable.initValue != 'undefined')
        t.extra.push(new Chat.Message(variable.initValue));
    else
        t.extra.push(variable.toTellrawExtra());
    t.tell(new Entities.Player("@a"));
}

cplApi.tellraw = function()
{
    var t = new Chat.Tellraw();

    for(var i = 0; i < arguments.length; i++)
    {
        var extra;
        if(typeof arguments[i].initValue != 'undefined')
            extra = new Chat.Message(arguments[i].initValue);
        else
            extra = arguments[i].toTellrawExtra();

        t.extra.push(extra);
    }

    t.tell(new Entities.Player("@a"));
}
