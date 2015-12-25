import("debug")
import("chat")

local myint = 42
local myfloat = 13.37
local mybool = true
local mystr = "hi"
local mytable = {42, 666, 3112}

local i = 0

function foo()
    i = i + 1
    if i == 3 then
        bar()
    else
        foo()
    end
end

function bar()
    i = i + 1
    if i == 6 then
        foobar()
    else
        bar()
    end
end

function foobar()
    i = i + 1
    if i == 9 then
        debug()
    else
        foobar()
    end

end

foo()
