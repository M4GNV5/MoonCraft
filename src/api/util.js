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

cplApi.async = function(func)
{
    if(func instanceof Runtime.Callback)
        func.emit();
    else if(typeof func == 'function')
        call(func);
    else
        throw "Invalid setTimeout callback '{0}'".format(callback);
}

cplApi.command = function()
{
	var cmd = "";
	for(var i = 0; i < arguments.length; i++)
		cmd += arguments[i].toString();

	command(cmd);
}
