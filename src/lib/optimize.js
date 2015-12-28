var scope = require("./Scope.js");

exports.selfAssign = function(left, val) // a = a + b --> a += b
{
    var leftSupported = ["+", "-", "*", "/", "%"];
    var rightSupported = ["+", "-", "*"];

    var varName = left.name;
    if(val.type == "BinaryExpression")
    {
        var op = val.operator;

        if(val.left.type == "Identifier" && val.left.name == varName && leftSupported.indexOf(op) != -1)
            return {operator: op, argument: val.right};
        else if(val.right.type == "Identifier" && val.right.name == varName && rightSupported.indexOf(op) != -1)
            return {operator: op, argument: val.left};
    }
};

exports.removeDeadEnds = function(stmtList)
{
    var endExpressions = ["ReturnStatement", "BreakStatement"];

    for(var i = 0; i < stmtList.length; i++)
    {
        var type = stmtList[i].type;
        if(endExpressions.indexOf(stmtList[i].type) != -1)
            return stmtList.slice(0, i + 1);
    }
    return stmtList;
};

exports.garbageCollect = function()
{
    var currScope = scope.current();

    for(var key in currScope)
    {
        if(currScope[key].clean)
            currScope[key].clean();
    }
};

exports.removeDoubleSplit = function(blocks)
{
    var sBlock = options.splitterBlock;
    for(var i = 0; i < blocks.length; i++)
    {
        if(blocks[i].tagName == sBlock && (blocks[i + 1] || {}).tagName == sBlock)
        {
            blocks.splice(i, 1);
            i--;
        }
    }

    if(blocks[blocks.length - 1].tagName == sBlock)
        blocks.splice(blocks.length - 1, 1);

    return blocks;
};
