import("chat")
import("math")
import("random")

function testSin()
    for value = 0.0, 6.28, 3.14 / 4 do
        tellraw("sin of ", value, " is ", sin(value))
    end
end

function testRandomAbsedSqrt()
    for i = 0, 10 do
        local value = abs(rand_fast() % 401)
        local result = sqrt(value)
        tellraw("sqrt of ", value, " is ", result)
    end
end

testSin()
testRandomAbsedSqrt()
