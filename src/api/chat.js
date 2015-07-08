cplApi.chat = {};

cplApi.chat.out = function(variable)
{
    cplApi.chat.tellraw("Output: ", variable);
};

cplApi.chat.generateTellraw = function()
{
    var t = new Chat.Tellraw();

    for(var i = 0; i < arguments.length; i++)
    {
        var obj = arguments[i];

        if(obj instanceof Chat.Message)
            t.extra.push(obj);
        else if(obj instanceof Entities.Selector)
            t.extra.push(new Chat.TellrawSelectorExtra(obj));
        else if(useExactTellraw && typeof obj.toExactTellrawExtra != 'undefined')
            t.extra = t.extra.concat(obj.toExactTellrawExtra());
        else if(typeof obj.toTellrawExtra != 'undefined')
            t.extra.push(obj.toTellrawExtra());
        else
            t.extra.push(new Chat.Message(obj.toString()));
    }

    return t;
};
var useExactTellraw = true;
cplApi.chat.exactTellraw = function(enable)
{
    useExactTellraw = enable === false ? false : true;
};

cplApi.chat.tellraw = function()
{
    var t = cplApi.chat.generateTellraw.apply(cplApi.chat, arguments);

    t.tell(new Entities.Player("@a"));
};

cplApi.chat.tellrawTo = function()
{
    var args = [];
    for(var i = 1; i < arguments.length; i++)
        args.push(arguments[i]);

    var t = cplApi.chat.generateTellraw.apply(cplApi.chat, args);

    t.tell(arguments[0]);
};

cplApi.chat.message = function(text, color, clickEvent, hoverEvent, bold, italic, obfuscated, underlined, strikethrough)
{
    return new Chat.Message(text, Chat.Color[color] || undefined, bold ,italic, obfuscated, underlined, strikethrough, clickEvent, hoverEvent);
};

cplApi.chat.event = function(action, value)
{
    return new ChatEvent(action, value);
};
function ChatEvent(action, value)
{
    this.action = action;
    this.value = value;
}

cplApi.chat.callbackEvent = function(func)
{
    if(typeof func == 'function')
        return new Chat.CallbackClickEvent(func);
    else if(func instanceof Runtime.Callback)
        return new Chat.CallbackClickEvent(function() { func.emit(); });
    else
        throw "Invalid callbackEvent callback '{0}'".format(callback);
};
