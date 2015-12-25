exports._rand_fast = function(result, rnd, withValue)
{
    for(var i = 0; i < 30; i++)
    {
        result.add(rnd);
        withValue.multiplicate(2);
    }
}
