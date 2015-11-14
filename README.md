#MoonCraft
Lua to commandblock compiler

##Video
[![demo video](demo.gif)](http://gfycat.com/ZestyTenseBufeo)

##Example
```lua
import("chat")

radius = 1
pi = 3.14

tellraw("Circle circumference and area for radius 1 to 19")
while radius < 20 do
    area = pi * radius * radius
    circumference = pi * 2 * radius

    tellraw("r = ", radius, " C = ", circumference, " A = ", area)
    radius = radius + 1
end
```
