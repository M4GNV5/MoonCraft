cplApi.util = {};

cplApi.util.setTimeout = function(callback, time)
{
	time = parseInt(time);

    if(callback instanceof Runtime.Callback)
        setTimeout(function() { callback.emit(); }, time);
    else if(typeof callback == 'function')
        setTimeout(callback, time);
    else
        throw "Invalid setTimeout callback '{0}'".format(callback);
}

cplApi.util.asyncOnce = function(func)
{
    if(func instanceof Runtime.Callback)
        throw "delegates cannot be called once!"
    else if(typeof func == 'function')
        callOnce(func);
    else
        throw "Invalid asyncOnce callback '{0}'".format(callback);
}

cplApi.util.command = function()
{
	var cmd = "";
	for(var i = 0; i < arguments.length; i++)
		cmd += arguments[i].toString();

	command(cmd);
}

cplApi.util.log = function(msg)
{
    api.log(msg.toString());
}
