import("chat")

local table = {42, 666, 3112}

for i = 1, 7 do
    table[#table + 1] = i
end

table_insert(table, 2, 1337)
table_remove(table, 7)

for i = 1, #table do
    tellraw("entry ", i, " is ", table[i])
end
