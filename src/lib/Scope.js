function Scope()
{
    this.stack = [{}];
}

Scope.prototype.increase = function(val)
{
    this.stack.push(val || {});
};

Scope.prototype.decrease = function()
{
    if(this.stack.length == 1)
        throw "cannot go below global in scope";

    return this.stack.splice(this.stack.length - 1, 1)[0];
};

Scope.prototype.current = function()
{
    return this.stack[this.stack.length - 1];
};

Scope.prototype.set = function(key, val)
{
    this.current()[key] = val;
};

Scope.prototype.get = function(key)
{
    for(var i = this.stack.length - 1; i >= 0; i--)
    {
        if(this.stack[i].hasOwnProperty(key))
        {
            return this.stack[i][key];
        }
    }
};

Scope.prototype.setGlobal = function(key, val)
{
    this.stack[0][key] = val;
};

module.exports = Scope;
