import("./random.js")

function rand_fast()
    command("summon ArmorStand ~ ~ ~ {NoGravity:true,Tags:[\"random\"]}")
    command("summon ArmorStand ~ ~ ~ {NoGravity:true,Tags:[\"random\"]}")

    local rnd = score("@r[type=ArmorStand,tag=random]", OBJECTIVE_NAME)
    local both = score("@e[type=ArmorStand,tag=random]", OBJECTIVE_NAME)

    local result = 0
    rnd = 1

    _rand_fast(result, rnd, both)

    both = 1
    rnd = -1
    result = result * rnd

    command("kill @e[type=ArmorStand,tag=random]")
    return result
end

function rand_small()
    command("summon ArmorStand ~ ~ ~ {NoGravity:true,Tags:[\"random\"]}")
    command("summon ArmorStand ~ ~ ~ {NoGravity:true,Tags:[\"random\"]}")

    local rnd = score("@r[type=ArmorStand,tag=random]", OBJECTIVE_NAME)
    local both = score("@e[type=ArmorStand,tag=random]", OBJECTIVE_NAME)

    local result = 0
    rnd = 1

    for i = 0, 29 do
        result = result + rnd
        both = both * 2
    end

    both = 1
    rnd = -1
    result = result * rnd

    command("kill @e[type=ArmorStand,tag=random]")
    return result
end
