import("chat")

--average speed
speed = 8 --m/s

working = true
direction = 0   -- 0=z+ 1=x- 2=z- 3=x+
rail = -1
totalCount = 0


command("give @p minecraft:armor_stand 1 0 {EntityTag:{CustomName:train}}")

tellraw("Please place the armorstand at the beginning of the track")
repeat
    --wait
until "testfor @e[type=ArmorStand,name=train]"



waitTime = 20
repeat
    waitTime = waitTime - 1
until waitTime == 0


tellraw("Please wait, detection in progress...")
command("execute @e[type=ArmorStand,name=train] ~ ~ ~ summon ArmorStand ~ ~ ~ {CustomName:\"track\",Invisible:1b}")

while working do

    totalCount = totalCount + 1

    if "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:rail 0" then
        rail = 0
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:rail 1" then
        rail = 1
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:golden_rail 0" then
        rail = 0
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:golden_rail 1" then
        rail = 1
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:golden_rail 8" then
        rail = 0 --powered straight rail
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:golden_rail 9" then
        rail = 1 --powered straight rail
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:rail 6" then
        rail = 6
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:rail 7" then
        rail = 7
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:rail 8" then
        rail = 8
    elseif "execute @e[type=ArmorStand,name=train] ~ ~ ~ testforblock ~ ~ ~ minecraft:rail 9" then
        rail = 9
    else
        working = false
        direction = -1
    end

    if direction == 1 and rail == 6 or direction == 3 and rail == 7 then
        direction = 0
    elseif direction == 2 and rail == 7 or direction == 0 and rail == 8 then
        direction = 1
    elseif direction == 3 and rail == 8 or direction == 1 and rail == 9 then
        direction = 2
    elseif direction == 0 and rail == 9 or direction == 2 and rail == 6 then
        direction = 3
    end

    if direction == 0 then
        command("tp @e[type=ArmorStand,name=train] ~ ~ ~1")
    elseif direction == 1 then
        command("tp @e[type=ArmorStand,name=train] ~-1 ~ ~")
    elseif direction == 2 then
        command("tp @e[type=ArmorStand,name=train] ~ ~ ~-1")
    elseif direction == 3 then
        command("tp @e[type=ArmorStand,name=train] ~1 ~ ~")
    end

end

command("kill @e[type=ArmorStand,name=train]")
travelTime = float(totalCount - 1) / speed
tellraw("Detection done, estimated travel time: ", travelTime, " seconds")



while true do
    repeat
        -- body...
    until "execute @e[type=ArmorStand,name=track] ~ ~ ~ testfor @p[r=0]"

    title_times(0, 99999, 0)
    title("")

    _travelTime = travelTime
    while _travelTime > 0 do
        _travelTime = _travelTime - 0.05
        subtitle("remaining time: ", _travelTime)
    end
    title_clear()
end
