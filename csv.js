#!/usr/bin/env node
 // parser.js
// usage node JsonToCsv.js --m byTool [--feature pos|...] [--morpheme]
"use strict"
var config = require('./config');
var argv = require('yargs')
    .usage('Usage: JsonToCsv.js -t byTool')
    .describe("f", "path of input file")
    .default('f', "/dev/stdin")
    .demand('t').describe('t', 'byTool or byFeature')
    .demand('raw').describe('raw', 'which raw to use as input')
    .describe("feat", "pos or any other supported feature:" + config.features.join(","))
    .default("feat", "pos")
    // .boolean("m").describe("m", "morpheme-based conversion, word-based otherwise")
    .boolean("showErrors").describe("showErrors", "")
    .describe("showWord", "show (all), only (closed) words, or (none)").default("showWord", "all")
    .argv

var csv_stringify = require('csv-stringify');
var JSONStream = require('JSONStream');
var fs = require('fs');


if (config.features.indexOf(argv.feat) < 0) {
    console.error("Feature requested:", argv.feat, " is not supported")
    console.error("Features supported:", config.features.join(","))
    process.exit(1)
}
var line2 = {
    chapter: "",
    ayah: "",
    wordpos: "",
    utf8: "",
    feature: "",
    type: "",
}
var tools = argv.t.split(":")

var columns = [];
if (argv.d) {
    columns.push("0-index")
}
if (argv.showWord != "none") {
    columns.push("word")
}

for (let i in tools) {
    line2[i] = "-";
    columns.push(tools[i]);
    if(argv.d)
        columns.push("w"+tools[i]);
}
var stringifier = csv_stringify({
    columns: columns,
    header: true,
    quoted: true,
    quotedString: true,
})
stringifier.pipe(process.stdout);

var arr = []
var morphemes = []
var raw1 = ""
var morphemesutf = []
var allwords = []
var allwordspos = []
var myapp = {
    usealignment: function(data, key) {
        if (data.name)
            process.stderr.write("\r" + data.name)
        if (key[0] == "META") {
            // console.error(arr)
            // console.error(morphemes)
            Object.keys(morphemes).forEach(tool => morphemes[tool].forEach((featArr, wid) => featArr.forEach((featVal, mid) => {
                if (!arr[wid + "-" + mid]) {
                    if (!morphemesutf[tool][wid])
                        console.error(morphemesutf, data.name, tool, featArr, wid, featVal, mid)
                    arr[wid + "-" + mid] = {
                        "0-index": [data.name, wid + 1, mid + 1].join("-"),
                        "c": (wid + 1) * 100 + (mid + 1), // compare
                        "words": [],
                    }

                    // arr[wid+"-"+mid][argv.arff] = "?"
                    if (argv.notaligned)
                        tools.forEach(t => arr[wid + "-" + mid][t] = "-----")
                    else
                        tools.forEach(t => arr[wid + "-" + mid][t] = "?")
                }

                if(morphemesutf[tool][wid][mid] && arr[wid + "-" + mid].words.indexOf(morphemesutf[tool][wid][mid])<0 &&  morphemesutf[tool][wid][mid] !== "?")
                    arr[wid + "-" + mid].words.push(morphemesutf[tool][wid][mid])
                if(argv.d)
                    arr[wid + "-" + mid]["w"+tool] = morphemesutf[tool][wid][mid]
                if (featVal != "E")
                    // if(featVal!="-----")
                    arr[wid + "-" + mid][tool] = featVal

                if (featVal == "E" && argv.showErrors)
                    arr[wid + "-" + mid][tool] = featVal
            })))
            // console.error(arr)
            Object.keys(arr).sort((a, b) => arr[a].c - arr[b].c).forEach(pair => {
                // set the word to be the tallest 
                arr[pair].word = arr[pair].words.find(v=>v.length == arr[pair].words.reduce((a, b) => Math.min(a, b.length),arr[pair].words[0].length))
                if (Object.keys(arr[pair]).map(mm => mm.length == 2 ? arr[pair][mm] : "").join("-").replace(/[?-]/g, "") !== "") {
                    if (argv.showWord == "closed" && config.QAclosedSetWords.indexOf(arr[pair].word) >= 0) {
                        // do not do anything
                    } else if (argv.showWord == "all") {
                        allwords.push(arr[pair].word)
                        allwordspos.push(arr[pair].word + arr[pair].QA)
                    } else if (argv.showWord == "closed" && allwords.indexOf(arr[pair].word) < 0 && config.QAClosedTags.indexOf(arr[pair].QA) > 0) {
                        allwords.push(arr[pair].word)
                        allwordspos.push(arr[pair].word + arr[pair].QA)
                    } else
                        arr[pair].word = "?"
                    if (arr[pair].QA != "?")
                        stringifier.write(arr[pair])
                }

            })

            // }
            arr = []
            morphemes = []
        }
        //case alignment is based on non-seg input, diac input or input segmented using FA)
        else if (key[0] == "Raw" || key[0] == "RawDia" || key[0] == "RawSeg") {
            if (key[0] == "RawSeg") {
                raw1 = data;
            }
        } else if (tools.indexOf(key[0]) < 0){
            return;
        // } else if (!data || data.error) {
            // console.error(data);
        } else {
            if (!argv.showErrors)
                morphemes[key[0]] = data.map(d => {
                    return d.error ? [] : d.analyses[d.choice].al_morphemes.map(morph => morph[argv.feat])
                })
            else {
                morphemes[key[0]] = data.map(d => {
                    return d.error ? [] : d.analyses[d.choice].al_morphemes.map(morph => {
                        if (morph[argv.feat] == "E" && morph.orig != "-----" && !morph.orig)
                            console.error(key[0], morph, d)
                        try {
                            return morph[argv.feat] == "E" ? (morph.orig == "-----" ? morph.orig : morph.orig[argv.feat]) : morph[argv.feat]
                        } catch (e) {
                            console.error("tool,tool.orig=", morph, morph.orig)
                            console.error(e)
                        }
                    })
                })
            }
            morphemesutf[key[0]] = data.map(word => {
                return word.error ? [] : word.analyses[word.choice].al_morphemes.map(morph => {
                    if (morph.pos == "-----")
                        return "?";
                    else
                        return morph.utf8.replace(/[\u064b-\u065fٰ۠ۥۦۢ۟]/g, '') // short vowels
                })
            })
        }
    }
}

var ress = fs.createReadStream(argv.f)
    .pipe(JSONStream.parse("*", myapp.usealignment))

// }))
// .pipe(JSONStream.stringify())
// .pipe(process.stdout);

ress.on("end", function() {
    console.error("allwords", JSON.stringify({ "allwords": allwords }))
    // console.error("allwords",JSON.stringify({"allwords":allwordspos}))
    // console.error("allwords",JSON.stringify({"morphemesutf":morphemesutf}))
})
process.stdout.on('error', process.exit);