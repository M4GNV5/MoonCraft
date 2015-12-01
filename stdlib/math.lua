function abs(val)
    if val < 0 then
        return -val
    else
        return val
    end
end

randomSeed = js_eval("Math.round(Math.random() * 10000)")
function random()
    randomSeed = (randomSeed * 214013 + 2531011) % 32768
    return randomSeed
end

function pow(base, exponent)
    result = 1

    while exp > 0 do
        result = result * base
        exp = exp - 1
    end

    return result
end

function sqrt(value)
    curr = int(value)
    currplusone = curr

    curr2 = 0
    currpone2 = 0

    if curr < 0 then
        damnitfixthebugs = 0
        return damnitfixthebugs
    end

    repeat
        curr = (curr + value / curr) / 2 --ty Heron of Alexandria
        currplusone = curr + 1
        curr2 = curr * curr
        currpone2 = currplusone * currplusone
    until curr2 <= value and value < currpone2

    if value - curr2 < currpone2 - value then
        return curr
    else
        return currplusone
    end
end

function sin(value)

    --https://upload.wikimedia.org/math/a/3/b/a3b692cd234b734e121ef24621f3635b.png

    value = (-value + 3.14) % 6.28

    result = value

    numerator = value
    numerator = numerator * value
    numerator = numerator * value
    result = result - numerator / 6

    numerator = numerator * value
    numerator = numerator * value
    result = result + numerator / 120

    numerator = numerator * value
    numerator = numerator * value
    result = result - numerator / 5040

    numerator = numerator * value
    numerator = numerator * value
    result = result + numerator / 362880

    return result

end
