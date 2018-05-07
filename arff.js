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
        this.tools = argv.t.split(":")

        this.columns = [];
        this.columns.push("feat")
        this.columns.push("0-index")
        if (argv.useEmbeddings) {
            for (let i = 0; i < config.dim; i++) {
                this.columns.push("word" + i)
            }
        }
        else if (argv.showWord != "none") {
            this.columns.push("word")
        }




        for (let i in this.tools) {
            this.columns.push(this.tools[i]);
            if (argv.d)
                this.columns.push("w" + this.tools[i]);
        }


        argv.feats.forEach(feat => {
            if (config.features.indexOf(feat) < 0) {
                console.error("Feature requested:", argv.feat, " is not supported")
                console.error("Features supported:", config.features.join(","))
                process.exit(1)
            }
        })
    }
    
    printHeader(feat) {
        var all = []
        all.push(["@relation", this.argv.name || "tmp"])
        all.push(["@attribute", "0-index", "string"])
        if (this.argv.d) {
            // all.push(["@attribute","word","string"])
        }
        if (this.argv.useEmbeddings) {
            for (let i = 0; i < config.dim; i++) {
                all.push(["@attribute", "word" + i, "numeric"])
            }
        } else if (this.argv.showWord == "all") {
                all.push(["@attribute", "word", "string"])
        } else if (this.argv.showWord == "closed") {
            all.push(["@attribute", "word", "{" + config.QAclosedSetWords.join(",") + "}"])
        }
        for (let t of this.tools) {
            all.push(["@attribute", t, "{" + config[feat][t].join(",") + "}"])
        }
        all.push(["@data"])
        return all.map(x => x.join("\t")).join("\n")
    }
}




if (require.main === module) { // called directly
    var argv = require('yargs')
        .usage('Usage: sawaref-converters-arff -t byTool')
        .describe("f", "path of input file").default('f', "/dev/stdin")
        .describe("o", "path of output file").default('o', "/dev/stdout")
        .describe("feat", "pos or any other supported feature:" + config.features.join(","))
        .default("feat", "pos")
        // .boolean("m").describe("m", "morpheme-based conversion, word-based otherwise")
        .boolean("showErrors").describe("showErrors", "")
        .boolean("notaligned").describe("notaligned", "process file as it is not aligned").default("notaligned", false)
        .describe("showWord", "show (all), only (closed) words, or (none)").default("showWord", "none")
        .argv
    argv.feats = [argv.feat]
    let arff = new ArffConverter(argv)
    var stringifier = csv_stringify({
        columns: arff.columns,
        header: false,
        quoted: false,
        quotedString: false,
    })

    let outstream = fs.createWriteStream(argv.o)
    outstream.write(arff.printHeader(argv.feat) + "\n")
    let ress = fs.createReadStream(argv.f)
        .pipe(JSONStream.parse("*", function(data, key) {
            return [key[0], data]
        }))
        .pipe(es.through(arff.usealignment()));

    // ress= ress.pipe(es.through(function(data){
    //     console.log(data)
    //     this.emit("data",data)
    // }))
    // .pipe(JSONStream.parse())
    ress = ress.pipe(stringifier)
        .pipe(es.through(function(data) {
            var str = data.toString("utf-8")
            var ii = str.indexOf(",")

            // all[str.substring(0,ii)].push(str.substring(ii+1))
            this.emit("data", str.substring(ii + 1))
        }, function end() {
            this.emit("data", "")
            this.emit("end")
            if (arff.argv.useEmbeddings && arff.argv.useEmbeddings.indexOf("ws://") === 0)
                arff.embeddings.shouldClose()
        }))
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