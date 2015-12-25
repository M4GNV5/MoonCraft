import("chat")

function debug_backtrace()
    count = 0
    debug_stackcount(count)

    tellraw(chat_message("Stacktrace:", "red"))

    for i = 2, count do
        tellraw("- ", debug_select_stack(i))
    end
end

function debug_break()
    await = 0

    tellraw(
        chat_message("Breakpoint reached. ", "red"),
        chat_message("[continue]", "blue", false,
            chat_event("run_command", "/scoreboard players set " .. js_eval("await.name") .. " " .. OBJECTIVE_NAME .. " 1")
        )
    )

    repeat
        -- wait...
    until await == 1
end

import("./debug.js")
