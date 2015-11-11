a = 42
b = 3 * 7 + a % 9

if b < 0 then
    --integer overflow
    b = 42
elseif b == 0 then
    --wut?
    b = 666
else
    result = b
end

result = 42
