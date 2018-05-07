// parser.js
var csv_stringify = require('csv-stringify');
var argv = require('minimist')(process.argv.slice(2));
var JSONStream = require('JSONStream');
var es = require('event-stream');
var config = require('./config');
var fs = require('fs');

var line2 = {

};
var tools = config.tools;

var columns = ["tool","word","wordpos","tool","pos","3",   "7",   "8",   "9",   "11",  "13",  "14"];
// var prime = ["pos"];
// for(var tool in tools){

//     for (i in prime){
//         columns.push(tool+"_"+prime[i]);
//         line2[tool+"_"+prime[i]] = "";
//     }
// }
for (var i = 0; i < 22; i++) {
    // columns.push(i+1);
};

function byTool(data) {
            // for each 
    var lines = [];
    // console.error(data);
    for (var i in data.Raw) { // for every word
        // var x = {};//JSON.parse(JSON.stringify(line2)); // clone obj
        for(var j in tools){

            // the case there is word not exist in tool
            if (!data[j]) {
                console.error("tool is not defined! TOOL=" + j);
            } else if (!data[j][i]) {
                x[j+"_pos"] = "-";
            } else if (data[j][i].error) {
                x[j+"_pos"] = "-";
            } else if (data[j][i]["sawalaha"]){
                //only one analysis
                console.log("should never be here");
                
                // var prefix_lines = [];
                // var suffix_lines = [];
                var poses = []
                // var theMin = data[j][i]

                // for (var k in theMin.prefix_pos) {
                //     prefix_lines[k] = theMin.prefix_pos[k];
                // }
                // for (var k in theMin.suffix_pos) {
                //     suffix_lines[k] = theMin.suffix_pos[k];
                // }
                // poses.push(prefix_lines.join("+")+"#"+a.sawalaha+"#"+suffix_lines.join("+"));
                // x[j+"_pos"] = poses.join("\t\n");
                x.pos = a.pos;
                for(var p in a.sawalaha){
                    x[p] = a.sawalaha.charAt(p);
                }
                lines.push(x);
            }
            else {
                //find the best
                var poses = []
                for (var k in data[j][i].analyses) {
                    var x = {};
                    x["wordpos"] = i;

                    x["word"] = data.Raw[i];
                    x["tool"] = j;
                    // var prefix_lines = [];
                    // var suffix_lines = [];
                    var a = data[j][i].analyses[k];
                    // for (var k in a.prefix_pos) {
                    //     prefix_lines[k] = a.prefix_pos[k];
                    // }
                    // for (var k in a.suffix_pos) {
                    //     suffix_lines[k] = a.suffix_pos[k];
                    // }
                    // poses.push(prefix_lines.join("+")+"#"+a.sawalaha+"#"+suffix_lines.join("+"));
                    x.pos = a.pos;
                    for(var p in a.sawalaha){
                        x[p] = a.sawalaha.charAt(p);
                    }
                    lines.push(x);
                }
                // uniqueArray = poses
                // .filter(function(item, pos) {
                //     return poses.indexOf(item) == pos;
                // })
                // x[j+"_pos"] = uniqueArray.join("\t\n");

            }
        }
        
    }

        
    // var x = JSON.parse(JSON.stringify(line2)); // clone obj
    // for(var i in x){
    //     x[i]= "-"
    // }

    // lines.push(x);

    return lines;
}
var r = process.stdin
    .pipe(JSONStream.parse("*", function(data, thekey) {
        // for each file (ayah)
        // var arr = thekey[0].replace(".json", "").split("-");
        // data.chapter = arr[0];
        // data.ayah = arr[1];
        return data;
    }))
    .pipe(es.mapSync(byTool))
    .pipe(es.through(function write(data) {
            //console.log(data);
            for (var i in data){
                // for (var k in data[i]){
                //     if(!data[i][k])
                //         data[i][k] = "-";
                // }
                // console.error(data[i])
                this.emit('data', data[i])
            }
        },
        function end() { //optional
            this.emit('end')
        }))
    .pipe(csv_stringify({
        columns: columns,
        header: true,
        quoted: true,
    }))
    .pipe(process.stdout);

// r.on("end", function() {
//     var path = "/morpho/results";
//     fs.writeFileSync(path + "/QAC.json", text);
//     text = "";
// })
process.stdout.on('error', process.exit);



/**
0   لا
1   يُؤْمِنُ
2   أَحَدُكُمْ
3   حَتَّى
4   يَكُونَ
5   هَوَاهُ
6   تَبَعًا
7   لِمَا
8   جِئْتُ
9   بِهِ
*/