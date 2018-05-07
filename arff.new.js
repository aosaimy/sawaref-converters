#!/usr/bin/env node
 // parser.js
// usage node JsonToCsv.js --m byTool [--feature pos|...] [--morpheme]
"use strict"
var config = require('./config');
var csv_stringify = require('csv-stringify');
var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs');
// var request = require('request');

class ArffConverter {
    constructor(argv) {
        this.argv = argv
        this.tools = []//argv.t.split(":")

        this.columns = [];
        
        // this.columns.push("feat")
        this.columns.push("0-index")
        for (let f of argv.feats) {
            this.columns.push(f)
        }
        this.columns.push(argv.class)
        this.errorThrown = false
    }
    
    print() {
        var that = this
        return function(data){
            for(let x of that.argv.feats){
                if(!data[x])
                    data[x] = "-----"
            }
            for(let x in data){
                if(data[x]=="na" || data[x]=="-")
                    data[x] = "-----"
                if(argv.feats.indexOf(x)<0 || x.indexOf("word")===0 || x=="0-index" || x=="c")
                    continue
                // console.log(x);
                if(config[x].indexOf(data[x])<0){
                    console.error("Value is not defined in feature values: ",x,data[x]);
                    config[x].push(data[x])
                    this.errorThrown = true
                }
            }
            if(!this.errorThrown)
                this.emit("data",data);
        }
    }
    printHeader() {
        var all = []
        all.push(["@relation", this.argv.name || "tmp"])
        all.push(["@attribute", "0-index", "string"])
        for (let t of this.argv.feats) {
            if(t.indexOf("word")===0)
                all.push(["@attribute", t, "numeric"])
            else if(config[t])
                all.push(["@attribute", t, "{" + config[t].join(",") + "}"])
            else{
                console.error("feature values is not available:",t);
                this.errorThrown = true
            }
        }
        if(this.errorThrown){
            console.error("Stopping..");
            process.exit(1)
        }
        if(argv.class)
            all.push(["@attribute", argv.class, "{" + config[argv.class].join(",") + "}"])
        all.push(["@data"])
        return all.map(x => x.join("\t")).join("\n")
    }
}

function getFeatures(features, tools, dimSize){
    var list = []
    for (var f of features)
        for (var t of tools)
            list.push(t+f)
    for (var i = 0; i < dimSize; i++) {
        list.push("word"+i)
    }
    return list
}


if (require.main === module) { // called directly
    var argv = require('yargs')
        .usage('Usage: sawaref-converters-arff')
        .describe("f", "path of input file").default('f', "/dev/stdin")
        .describe("o", "path of output file").default('o', "/dev/stdout")
        .describe("class", "class feature.").default("class", false).alias("class", "c")
        .describe("feats", "The complete set of features").default("feats", getFeatures(config.features,["MX","ST","AM","FA","QA"],100))
        .describe("include", "features to include. REGEX").default("include", ".*").alias("include", "i")
        .describe("exclude", "features to exclude. REGEX. Default will include class feature").alias("exclude", "x").default("exclude", ["utf8","lem","gloss","stem","main",".*fix","root","sawalaha"])
        .boolean("ex").describe("ex", "Keep original exclude. Add mode.")
        .boolean("showErrors").describe("showErrors", "")
        .boolean("notaligned").describe("notaligned", "process file as it is not aligned").default("notaligned", false)
        .describe("showWord", "show (all), only (closed) words, or (none)").default("showWord", "none")
        .argv
    if(!Array.isArray(argv.exclude)) argv.exclude = [argv.exclude]
    if(argv.ex){
        argv.exclude = argv.exclude.concat(["utf8","lem","gloss","stem","main",".*fix","root","sawalaha"])
    }
    if(!Array.isArray(argv.include)) argv.include = [argv.include]
    argv.include = argv.include.map(x=>new RegExp(x))
    argv.exclude = argv.exclude.map(x=>new RegExp(x))
    argv.feats = argv.feats.filter(x=> argv.class !== x)
    argv.feats = argv.include.map(inc=>{
        return argv.feats.filter(x=> inc.test(x))
    }).join(",").split(",")
    argv.exclude.forEach(ex=>{
        argv.feats = argv.feats.filter(x=> !ex.test(x))
    })    
    if(argv.d)
        console.log("Feats (",argv.feats.length,"):",argv.feats.join(","))
    // process.exit(1)
    let arff = new ArffConverter(argv)
    var stringifier = csv_stringify({
        columns: arff.columns,
        header: false,
        quoted: false,
        quotedString: false,
    })

    let outstream = fs.createWriteStream(argv.o)
    outstream.write(arff.printHeader(argv.feat) + "\n")
    fs.createReadStream(argv.f)
        .pipe(JSONStream.parse("*"))
        .pipe(es.through(arff.print()))
        .pipe(stringifier)
        .pipe(outstream)



    process.stdout.on('error', process.exit);
} else {
    module.exports = {
        /// NOT COMPLETE
        // "pipe": function(from, to, options) {
        //     options.o = to
        //     let arff = new ArffConverter(options)
        //     let ress = fs.createReadStream(from)
        //         .pipe(JSONStream.parse("*", arff.usealignment()))

        //     ress.on("end", function() {

        //     })
        //     process.stdout.on('error', process.exit);
        // },
        "getArffs": function(from_stream, feats, argv, callback) {

            argv.feats = feats
            argv.callback = callback


            let arff = new ArffConverter(argv)
            var all = {}
            var stringifier = csv_stringify({
                columns: arff.columns,
                header: false,
                quoted: false,
                quotedString: false,
            })

            feats.forEach(feat => {
                all[feat] = arff.printHeader(feat)
            })
            let ress = from_stream
                .pipe(JSONStream.parse("*", function(data, key) {
                    return [key[0], data]
                }))
                .pipe(es.through(arff.usealignment()))

            if (argv.useEmbeddings && argv.useEmbeddings.indexOf("ws://") === 0)
                ress = ress.pipe(es.through(arff.getEmbeddings()))

            ress = ress.pipe(stringifier)
                .pipe(es.through(function(data) {
                    var str = data.toString("utf-8")
                    var ii = str.indexOf(",")
                    all[str.substring(0, ii)].push(str.substring(ii + 1))
                    // this.emit("data",data.toString("utf-8"))
                }, function end() {
                    if (arff.argv.useEmbeddings && arff.argv.useEmbeddings.indexOf("ws://") === 0)
                            arff.embeddings.shouldClose()
                    callback(all, arff)

                }))
            ress.on("end", function() {
                //     for (let feat of argv.feats) {
                //         // console.log(JSON.stringify(config[feat], null, 4))
                //     }
            })
            process.stdout.on('error', process.exit);
        },
        /// NOT COMPLETE
        // "obj": function(argv) {
        //     return new ArffConverter(argv);
        // }
    }
}