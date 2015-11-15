import("chat")
import("math")

function testSin()
    value = float(0)
    while value <= 6.28 do
        tellraw("sin of ", value, " is ", sin(value))
        value = value + 3.14 / 4
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
