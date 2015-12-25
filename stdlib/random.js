exports._rand_fast = function(result, rnd, both)
{
    for(var i = 0; i < 30; i++)
    {
        result.add(rnd);
        both.multiplicate(2);
    }
}
