exports.selfAssign = function(stmt) // a = a + b --> a += b
{
    var leftSupported = ["+", "-", "*", "/", "%"];
    var rightSupported = ["+", "-", "*"];

    var varName = stmt.variables[0].name;
    var val = stmt.init[0];
    if(val.type == "BinaryExpression")
    {
        var op = val.operator;

        if(val.left.type == "Identifier" && val.left.name == varName && leftSupported.indexOf(op) != -1)
            return {operator: op, argument: val.right};
        else if(val.right.type == "Identifier" && val.right.name == varName && rightSupported.indexOf(op) != -1)
            return {operator: op, argument: val.left};
    }
}
