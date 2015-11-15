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
    step = 32768
    result = step

    while step > 0 do
        distance = result * result - value
        step = step / 2

        if distance == 0 then
            return result
        elseif distance < 0 then
            result = result + step
        elseif distance > 0 then
            result = result - step
        end
    end

    return result
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
