function Static(startVal, name)
{
    this.name = name;
    this.value = startVal;
}

Static.prototype.set = function(val)
{
    this.value = val;
}

Static.prototype.add = function(val)
{
    this.value += val;
}

Static.prototype.remove = function(val)
{
    this.value -= val;
}

Static.prototype.multiplicate = function(val)
{
    this.val *= val;
}

Static.prototype.divide = function(val)
{
    this.val /= val;
}

Static.prototype.mod = function(val)
{
    this.val %= val;
}

Static.prototype.toStatic = function()
{
    return parseInt(this.value);
}

Static.prototype.clone = function(cloneName)
{
    return new Static(this.value, this.name);
}

Static.prototype.toTellrawExtra = function()
{
    return JSON.parse(this.value.toString());
}

Static.prototype.isExact = function(val)
{
    return this.value == val;
}

Static.prototype.isBetweenEx = function(min, max)
{
    return this.value > min && this.value < max;
}

Static.prototype.isBetween = function(min, max)
{
    return this.value >= min && this.value <= max;
}

module.exports = Static;
