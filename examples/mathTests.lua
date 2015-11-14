import("chat")
import("math")

function testSin()
    value = float(0)
    while value < 7 do
        tellraw("sin of ", value, " is ", sin(value))
        value = value + 1.57
    end
end

function testRandomAbsedSqrt()
    i = 0
    while i < 10 do
        value = abs(random())
        result = sqrt(value)
        tellraw("sqrt of ", value, " is ", result)
        i = i + 1
    end
end

testSin()
testRandomAbsedSqrt()
