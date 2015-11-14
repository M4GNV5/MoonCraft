var itemIds = require("./itemIds.json");
var tagNames = {};
for(var i = 0; i < itemIds.length; i++)
{
    tagNames[itemIds[i].text_type] = i;
}

module.exports = function(blocks, cmdBlocks)
{
    console.log("Outputting as schematic to " + options.schematic_file);

    var blockCount = blocks.length + cmdBlocks.length;
    var width = options.length || 20;
    var height = 1;
    var length = Math.ceil(blockCount / 20);

    var tileEntities = [];
    var _blocks = new Array(blockCount);
    var data = new Array(blockCount);

    _blocks.fill(0);
    data.fill(0);

    for(var i = 0; i < blocks.length; i++)
    {
        var adress = (blocks[i].y * length + blocks[i].z) * width + blocks[i].x;
        var itemId = tagNames[blocks[i].tagName];

        _blocks[adress] = itemId;
        data[adress] = blocks[i].data & 0x0f;
    }
    for(var i = 0; i < cmdBlocks.length; i++) //{x: x, y: y, z: z, data: blockData, command: blocks[i].command}
    {
        var adress = (cmdBlocks[i].y * length + cmdBlocks[i].z) * width + cmdBlocks[i].x;

        _blocks[adress] = 211; //chain commandblock currently no in the item id list
        data[adress] =  cmdBlocks[i].data & 0x0f;

        tileEntities.push({
            Command: cmdBlocks[i].command,
            id: "control",
            x: cmdBlocks[i].x,
            y: cmdBlocks[i].y,
            z: cmdBlocks[i].z
        });
    }

    var data = {
        rootName: "Schematic",
        root: {
            Width: width,
            Height: height,
            Length: length,
            Materials: "Alpha",
            Blocks: _blocks,
            Data: data,
            Entities: [],
            TileEntities: tileEntities
        }
    };

    schema.TileEntities = new Array(tileEntities.length);
    schema.TileEntities.fill(controlSchema);

    toNBT(data, schema, function(err, _data)
    {
        if(err)
            throw err;

        require("fs").writeFileSync(options.schematic_file, _data);
    });
}

var tags = [
    "end",
    "byte",
    "short",
    "int",
    "long",
    "float",
    "double",
    "byteArray",
    "string",
    "list",
    "compound",
    "intArray"
];
function tagId(name)
{
    return tags.indexOf(name);
}
var schema = {
    Width: tagId("short"),
    Height: tagId("short"),
    Length: tagId("short"),
    Materials: tagId("string"),
    Blocks: tagId("byteArray"),
    Data: tagId("byteArray"),
    Entities: [
        {}
    ],
    TileEntities: []
};
var controlSchema = {
    Command: tagId("string"),
    id: tagId("string"),
    x: tagId("int"),
    y: tagId("int"),
    z: tagId("int")
};

//see https://github.com/M4GNV5/node-minecraft-world/blob/master/src/nbt/writer.js
var toNBT = (function()
{
    function createWriter(bufferFunc, size)
    {
        return function(value)
        {
            var buff = new Buffer(size);
            buff[bufferFunc](value, 0);
            this.buffer.push(buff);
        };
    }

    function schemaToType(schema)
    {
        if(typeof schema == "number")
        {
            return schema;
        }
        else if(schema instanceof Array)
        {
            if(schema[0] === tags.indexOf("byte"))
                return tags.indexof("byteArray");
            else if(schema[0] === tags.indexOf("int"))
                return tags.indexof("intArray");
            else
                return tags.indexOf("list");
        }
        else if(typeof schema == "object")
        {
            return tags.indexOf("compound");
        }
    }

    var Writer = function(data, schema, cb)
    {
        this.buffer = [];

        this.byte(10);
        this.string(data.rootName);
        this.compound(data.root, schema);

        var buff = Buffer.concat(this.buffer);

        if(schema.zipped)
        {
            zlib.gzip(buff, function(err, compressed)
            {
                cb(err, compressed);
            });
        }
        else
        {
            cb(undefined, buff);
        }
    }

    Writer.prototype.byte = createWriter("writeUInt8", 1);
    Writer.prototype.short = createWriter("writeInt16BE", 2);
    Writer.prototype.int = createWriter("writeInt32BE", 4);
    Writer.prototype.float = createWriter("writeFloatBE", 4);
    Writer.prototype.double = createWriter("writeDoubleBE", 8);

    Writer.prototype.end = function()
    {
        this.byte(0);
    }
    Writer.prototype.long = function(val)
    {
        this.int(val.left);
        this.int(val.right);
    }
    Writer.prototype.byteArray = function(val)
    {
        this.int(val.length);
        for(var i = 0; i < val.length; i++)
        {
            this.byte(val[i]);
        }
    }
    Writer.prototype.string = function(val)
    {
        this.short(val.length);
        this.buffer.push(new Buffer(val, "utf8"));
    }
    Writer.prototype.list = function(val, schema)
    {
        var type = schemaToType(schema[0]);
        this.byte(type);
        this.int(val.length);
        for(var i = 0; i < val.length; i++)
        {
            this[tags[type]](val[i], schema[i]);
        }
    }
    Writer.prototype.compound = function(val, schema)
    {
        for(var key in schema)
        {
            if(!val.hasOwnProperty(key))
                continue;

            var type = schemaToType(schema[key]);
            this.byte(type);
            this.string(key);
            this[tags[type]](val[key], schema[key]);
        }
        this.byte(tags.indexOf("end"));
    }
    Writer.prototype.intArray = function(val)
    {
        this.int(val.length)
        for(var i = 0; i < val.length; i++)
        {
            this.int(val[i]);
        }
    }

    return function toNBT(data, schema, callback)
    {
        new Writer(data, schema, callback);
    };
})();
