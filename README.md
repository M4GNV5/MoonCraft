#MoonCraft
Lua to commandblock compiler
###[Try it in your browser](http://m4gnv5.github.io/MoonCraft-Demo/)

##Example
```lua
import("chat")

radius = 1
pi = 3.14

tellraw("Circle circumference and area for radius 1 to 19")
for radius = 1, 19 do
    area = pi * radius * radius
    circumference = pi * 2 * radius

    tellraw("r = ", radius, " C = ", circumference, " A = ", area)
end
```

![screenshot](http://i.imgur.com/UbzM9CW.png)
