import("chat")
import("math")

for i = -1.75, 1.75, 0.25 do
    tellraw("floor(", i, ") = ", floor(i))
end

for i = -1.75, 1.75, 0.25 do
    tellraw("ceil(", i, ") = ", ceil(i))
end

for i = -1.75, 1.75, 0.25 do
    tellraw("round(", i, ") = ", round(i))
end
