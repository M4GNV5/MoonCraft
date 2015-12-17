import("./time.js")

function daytime()
    val = 0
    query_time_static(val, "daytime")
    return val
end

function gametime()
    val = 0
    query_time_static(val, "gametime")
    return val
end

function day()
    val = 0
    query_time_static(val, "day")
    return val
end
