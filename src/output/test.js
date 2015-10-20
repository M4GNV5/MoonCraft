var blocks = [];
var cmdblocks = [];
for(var i = 0; i < 100; i++)
{
    blocks.push({x: i%50+1, y: 4, z: Math.floor(i/50)+1, tagName: "sand", data: 0});
}

cmdblocks.push({x: 0, y: 4, z: 0, command: "fill ~ ~-1 ~ ~100 ~-1 ~ redstone_block"});
cmdblocks.push({x: 1, y: 4, z: 0, command: "scoreboard objectives add test dummy"});
cmdblocks.push({x: 2, y: 4, z: 0, command: "scoreboard objectives setdisplay sidebar test"});
cmdblocks.push({x: 3, y: 4, z: 0, command: "scoreboard players set test test 0"});
for(var i = 4; i < 100; i++)
{
    cmdblocks.push({x: i, y: 4, z: 0, command: "scoreboard players add test test 1"});
}

require("./rcon.js")(blocks, cmdblocks);
