import("chat")

local table = {42, 666, 3112}

for i = 1, 7 do
    table[#table + 1] = i
end

for i = 1, #table do
    tellraw("entry ", i, " is ", table[i])
end
