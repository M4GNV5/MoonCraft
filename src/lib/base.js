var optimize = require("./optimize.js");
var scoreName = require("./types.js").Integer.scoreName;

var functions = {};

var currBlocks = [];
var currLabel;
var blockCache = {};
var createLabel = [];

exports.command = GLOBAL.command = function command(cmd, conditional)
{
    conditional = !!conditional;
    var data = {type: "command", command: cmd, conditional: conditional, label: createLabel.slice(0)};
    currBlocks.push(data);

    if(createLabel.length > 0)
        createLabel = [];
};

exports.unshiftCommand = function unshiftCommand(cmd, conditional)
{
    conditional = !!conditional;
    var data = {type: "command", command: cmd, conditional: conditional, label: createLabel.slice(0)};
    currBlocks.unshift(data);
};

exports.block = GLOBAL.block = function block(tagName, data)
{
    currBlocks.push({type: "block", tagName: tagName, data: data || 0});
};

exports.jump = function jump(label, conditional)
{
    command("setblock %" + label + ":jmp% command_block 0 replace {Command:\"setblock ~ ~ ~ air\",auto:1b}", conditional);
};

exports.rjump = function rjump(label, conditional)
{
    command("summon ArmorStand %3:jmp% {NoGravity:1,Tags:[\"stack\"]}");
    command("scoreboard players add @e[type=ArmorStand,tag=stack] {0} 1".format(scoreName));
    exports.jump(label, conditional);
    block(options.splitterBlock);
};

exports.ret = function ret()
{
    command("execute @e[type=ArmorStand,tag=stack,score_{0}=1] ".format(scoreName) +
        "~ ~ ~ setblock ~ ~ ~ command_block 0 replace {Command:\"setblock ~ ~ ~ air\",auto:1b}");
    command("kill @e[type=ArmorStand,tag=stack,score_{0}=1]".format(scoreName));
    command("scoreboard players remove @e[type=ArmorStand,tag=stack] {0} 1".format(scoreName));
    block(options.splitterBlock);
};

exports.addLabel = function addLabel(name)
{
    createLabel.push(name);
};

exports.addFunction = function(label, fn)
{
    if(functions[label] == fn)
        return;
    else if(functions[label])
        throw "cannot use label " + label + " twice";

    var _blocks = currBlocks;
    var _createLabel = createLabel;
    currBlocks = [];
    createLabel = [];

    exports.addLabel(label);
    fn();

    functions[label] = currBlocks;
    currBlocks = _blocks;
    createLabel = _createLabel;
};

/*exports.newFunction = function(label)
{
    functions[currLabel] = currBlocks;
    currBlocks = [];

    exports.addLabel(label);
    currLabel = label;
}*/

var x = options.x;
var y = options.y;
var z = options.z;
var maxLength = options.length;
var direction = 5;
var nextDirection;
var curr = 1;
function move()
{
    if(direction == 5)
        x++;
    else if(direction == 4)
        x--;
    else if(direction == 3)
        z++;

    curr++;
    if(curr >= maxLength)
    {
        if(direction == 5)
        {
            direction = 3;
            nextDirection = 4;
        }
        else if(direction == 4)
        {
            direction = 3;
            nextDirection = 5;
        }
        else if(direction == 3)
        {
            direction = nextDirection;
            curr = 1;
        }
    }
}

var label = {};
var cmdBlocks = [];
var outputBlocks = [];
function format(cmd, index)
{
    var reg = /%[a-zA-Z0-9-\+_]+:[a-zA-Z]+%/;
    while(reg.test(cmd))
    {
        var result = reg.exec(cmd)[0];
        var split = result.slice(1, -1).split(":");
        var descriptor = split[0];
        var query = split[1];

        var block;
        if(!isNaN(parseInt(descriptor)))
            block = cmdBlocks[index + parseInt(descriptor)];
        else if(typeof label[descriptor] != "undefined")
            block = label[descriptor];
        else
            break; //throw "invalid formatting symbol " + result;

        var diffX = block.x - cmdBlocks[index].x;
        var diffY = block.y - cmdBlocks[index].y;
        var diffZ = block.z - cmdBlocks[index].z;
        block.diff = "~" + diffX + " ~" + diffY + " ~" + diffZ;
        block.diffR = "~" + (-1 * diffX) + " ~" + (-1 * diffY) + " ~" + (-1 * diffZ);
        block.jmp = "~" + diffX + " ~" + (diffY + 1) + " ~" + diffZ;

        cmd = cmd.replace(result, block[query].toString());
    }
    return cmd;
}

exports.output = function output(outputHandler)
{
    var _functions = [optimize.removeDoubleSplit(currBlocks)];
    for(var key in functions)
        _functions.push(optimize.removeDoubleSplit(functions[key]));

    for(var i0 = 0; i0 < _functions.length; i0++)
    {
        var blocks = _functions[i0];
        for(var i = 0; i < blocks.length; i++)
        {
            if(blocks[i].type == "command")
            {
                if(blocks[i + 1] && blocks[i + 1].conditional) //conditional commandblocks cannot be in corners
                {
                    var count = 0;
                    for(var ii = i + 1; blocks[ii] && blocks[ii].conditional; ii++)
                    {
                        count++;
                    }

                    if(curr + count >= maxLength)
                    {
                        while(curr != 1)
                        {
                            outputBlocks.push({x: x, y: y, z: z, tagName: "chain_command_block", data: direction});
                            move();
                        }
                    }
                }


                var blockData = blocks[i].conditional ? direction + 8 : direction;
                cmdBlocks.push({x: x, y: y, z: z, data: blockData, command: blocks[i].command});

                var _label = blocks[i].label;
                for(var ii = 0; ii < _label.length; ii++)
                {
                    label[_label[ii]] = {x: x, y: y, z: z};
                }
            }
            else if(blocks[i].type == "block")
            {
                outputBlocks.push({x: x, y: y, z: z, tagName: blocks[i].tagName, data: blocks[i].data});
            }
            move();
        }

        outputBlocks.push({x: x, y: y, z: z, tagName: options.splitterBlock, data: 0});
        move();
    }

    for(var i = 0; i < createLabel.length; i++)
        label[createLabel[i]] = {x: x, y: y, z: z};

    for(var i = 0; i < cmdBlocks.length; i++)
    {
        cmdBlocks[i].command = format(cmdBlocks[i].command, i, cmdBlocks);
    }

    outputHandler(outputBlocks, cmdBlocks);
};
