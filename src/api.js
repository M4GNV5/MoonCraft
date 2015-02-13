var cplApi = cplApi || {};
var vars =  vars || {};

cplApi.out = function(variable)
{
    var t = new Chat.Tellraw("Output: ");
    if(typeof variable.toTellrawExtra == 'undefined')
        t.extra.push(new Chat.Message(variable.toString()));
    else
        t.extra.push(variable.toTellrawExtra());
    t.tell(new Entities.Player("@a"));
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
