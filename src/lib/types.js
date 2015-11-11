GLOBAL.scoreName = "cplVars";
command("scoreboard objectives add " + scoreName + " dummy CPL Variables");

exports.Integer = require("./../types/Integer.js");
exports.Boolean = require("./../types/Boolean.js");
exports.Float = require("./../types/Float.js");
exports.String = require("./../types/String.js");
exports.Static = require("./../types/Static.js");
