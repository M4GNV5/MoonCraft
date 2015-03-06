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
