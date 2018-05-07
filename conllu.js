#!/usr/bin/env node
/**
This file parse the content (from the standard input) of the raw results of the tool 
and do some postprocessing as required.
*/
"use strict"
var buckwalter = require('buckwalter-transliteration');
buckwalter.bw2utf = buckwalter("bw2utf")
buckwalter.utf2bw = buckwalter("utf2bw")
//var csv = require('csv-streamify');
var fs = require('fs');
var JSONStream = require('JSONStream');
var es = require('event-stream');

const chalk = require('chalk');
const include = require('./include');

var tools = {
    ALL:[
        "KH",
        "AR",
        "EX",
        "AL",
        "BP",
        "BJ",
        "MS",
        "QT",
        "MT",
        "MD",
        "MA",
        "ST",
        "MR",
        "WP",
        "AM",
        "FA",
    ],
    MAN:[
        "KH",
        "AR",
        "EX",
        "AL",
        "BP",
        "BJ",
        "MS",
        "QT",
    ],
    POS:[
        "MT",
        "MD",
        "MA",
        "ST",
        "MR",
        "WP",
        "AM",
        "FA",
        ]
};

var featsInv = {
"aspect": "Aspect",
"case": "Case",
"definite": "Definite",
"state": "Definite",
"gender": "Gender",
"mood": "Mood",
"number": "Number",
"person": "Person",
// "animacy": "Animacy",
// "degree": "Degree",: 
"verbform": "VerbForm",
"voice": "Voice",
// "tense": "Tense",
// "negative": "Negative",
}

var raw = []
class ConvertToConll {
    constructor(argv){
        this.argv = argv
        this.mapToConllU =  {
        N:"NOUN",
        PN:"PROPN",
        ADJ:"ADJ",
        IMPN:"ADJ",
        PRON:"PRON",
        DEM:"PRON",
        REL:"PRON",
        T:"ADV",
        LOC:"ADV",
        ADV:"ADV",
        V:"VERB",
        P:"ADP",
        CONJ:"CCONJ",
        SUB:"SCONJ",
        ACC:"PART",
        AMD:"PART",
        ANS:"PART",
        AVR:"PART",
        CAUS:"PART",
        CERT:"PART",
        CIRC:"PART",
        COM:"PART",
        COND:"PART",
        EQ:"PART",
        EXH:"PART",
        EXL:"PART",
        EXP:"PART",
        FUT:"PART",
        INC:"PART",
        INT:"PART",
        INTG:"PART",
        NEG:"PART",
        PREV:"PART",
        PRO:"PART",
        REM:"PART",
        RES:"PART",
        RET:"PART",
        RSLT:"PART",
        SUP:"PART",
        SUR:"PART",
        VOC:"PART",
        INL:"PART",
        EMPH:"PART",
        IMPV:"PART",
        PRP:"PART",
        DET:"DET",
        INTJ:"INTJ",
        X:"X",
        SYM:"SYM",
        PUNCT:"PUNCT",
        NUM:"NUM",
        _:"X",
    }
    this.mapFeatureToConllU= {
    "Aspect=IMPF" : ["Aspect","Imp"],
    "Aspect=IMPV" : ["Aspect","Impv"],
    "Aspect=PERF" : ["Aspect","Perf"],
    "Case=ACC" : ["Case","Acc"],
    "Case=GEN" : ["Case","Gen"],
    "Case=NOM" : ["Case","Nom"],
    "Gender=F" : ["Gender","Fem"],
    "Gender=M" : ["Gender","Masc"],
    "Mood=JUS" : ["Mood","Jus"],
    "Mood=SUBJ" : ["Mood","Sub"],
    "Mood=IND" : ["Mood","Ind"],
    "Number=D" : ["Number","Dual"],
    "Number=P" : ["Number","Plur"],
    "Number=S" : ["Number","Sing"],
    "Number=Plural" : ["Number","Plur"],
    "Number=Singular" : ["Number","Sing"],
    "Voice=ACT" : ["Voice","Act"],
    "Voice=PASS" : ["Voice","Pass"],
    "Definite=DEF" : ["Definite","Def"],
    "Definite=INDEF" : ["Definite","Ind"],
        }
        this.counter =  1
    this.notMapped = {}
            this.stats =null

    this.toolsData =[]
    }
    do(tool, word, wid, i,theobj,callback) {
        var result = {}
        if(this.argv.sort == "m")
            result.sorting = ""
        if(this.argv.sort == "w")
            result.sorting = pad(parseInt(wid)+1,3)+tool
        if(this.argv.sort == "t")
            result.sorting = tool+pad(parseInt(wid)+1,3)
        result.tool = tool
        result.id = parseInt(wid)+1
        var morphemes = this.argv.align && theobj.al_morphemes ? theobj.al_morphemes : theobj.morphemes;
        morphemes.forEach(function(obj){
            obj.utf8 = obj.utf8 ? include.basicTaskeel(include.removeFinalTaskeel(obj.utf8)) : "";
        },word)

        if(morphemes.length > 1){
            // console.error(word,word.wutf8)
            this.printWord(this.counter,this.counter+morphemes.length-1,word.wutf8.trim(),callback)
        }

        morphemes.forEach((m,mid)=>{
            if(this.argv.sort == "m")
                result.sorting = pad(parseInt(wid)+1,3) + pad(parseInt(mid)+1,3) +tool
            if(morphemes.length > 1)
                result.id = (parseInt(wid)+1) //+ "-"+ mid
            result.form = m.utf8 || "_"
            result.lemma = (m.lem || m.stem) || "_"
            if(result.lemma != "_" && m.gloss)
                result.lemma += "±"+ m.gloss
            // result.upostag = tool
            result.xpostag = (m.map ? m.map.pos :  m.pos) || "_"
            result.xpostag = result.xpostag.trim()
            result.feats = {}
            for(var fi in featsInv){
                if(m.map && m.map[fi] && m.map[fi] != "-"){
                    let x = this.mapFeatureToConllU[featsInv[fi]+"="+m.map[fi]] || [featsInv[fi],m.map[fi]]
                    result.feats[x[0]] = x[1]
                }
            }
            result.feats = Object.keys(result.feats).map(x=>x+"="+result.feats[x]).join("|") || "_"
            // result.head = "_"
            // result.deprel = "_"
            // result.deps = "_"
            if(word.analyses.length > 1)
                result.misc = ["ANALSIS#="+(parseInt(i)+1)+
                    // "|TOOL="+tool +
                    "/"+word.analyses.length]
            else
                result.misc = []
            result.obj = m
            this.print(result,callback)
        })
    }
    
    convertToUPosTag(tag){
        var upos = this.mapToConllU[tag]
        if(!upos){
            if(!this.notMapped[tag]){
                console.error(chalk.red("XTag is not mapped to a UPOS tag! XPOS=",tag))
                this.notMapped[tag] = true
            }
            return tag;
        }
        return upos
    }
    
    print(result,callback){
        var line = []

        if(this.argv.miscs){
            // console.error(result);
            Object.keys(this.argv.miscs).forEach(key=>{
                if(result.obj[key])
                    result.misc.push(this.argv.miscs[key]+"="+result.obj[key].replace(" ","_"))
            })
        }
        if(this.argv.notstrict){
            result.misc = result.misc.join("|")
            for(var fi in result)
                line.push(result[fi])
        }
        else{
            // console.error(result)
            result.misc.push("TOOL="+result.tool)
            result.misc.push("WID="+result.id)
            line = [this.counter++, 
                    result.form.trim(),
                    result.lemma.trim(), 
                    this.convertToUPosTag(result.xpostag),
                    result.xpostag,
                    result.feats,
                    0,
                    "_",
                    "_",
                    result.misc.join("|")
            ]
        }
        if(!this.argv.q)
            callback(line.join("\t"));
    }
    printWord(from,to,form,callback){
        var line = [from+"-"+to, 
                    form,
                    "_",
                    "_",
                    "_",
                    "_",
                    "_",
                    "_",
                    "_",
                    "_"
            ]
        if(!this.argv.q)
            callback(line.join("\t"));
    }
    processWord(word,wid,tool){
        // var s = [this.argv.n,wid,tool].join("-")
            var pushToToolsDataFunc = x=>this.toolsData.push(x)
            
            if(word.error){
                if(this.argv.stats) this.stats.OOV[tool]++;
                // console.log([pad(parseInt(wid)+1,3)+tool,tool,parseInt(wid)+1,"UNK-WORD"].join("\t"));
                var result = {
                    id : parseInt(wid)+1,
                    form : word.utf8 || "_",
                    lemma : "_",
                    xpostag : "UNK",
                    feats : "_",
                    obj : {},
                    misc : ["ERROR"],
                }
                this.print(result,pushToToolsDataFunc)
                return;
            }
            if(this.argv.stats) this.stats.numOfAnalyses[tool].push(word.analyses.length);
            var lemmas = [];

            if(word.analyses.length == 1)
                word.choice = 0
            if(this.argv.c){
                if(word.choice!==undefined)
                    this.do(tool, word,  wid, word.choice, word.analyses[word.choice],pushToToolsDataFunc)
                else{
                    console.error([pad(parseInt(wid)+1,3)+tool,tool,parseInt(wid)+1,"NO-DISAMBG"].join("\t"));
                }
            }
            else{
                for (var aid in word.analyses) { // analyses
                    if(this.argv.stats && lemmas.indexOf(word.analyses[aid].lem || word.analyses[aid].stem)<0)
                        lemmas.push(word.analyses[aid].lem || word.analyses[aid].stem);
                    this.do(tool, word, wid, aid, word.analyses[aid],pushToToolsDataFunc)
                }
                if(this.argv.stats)
                    this.stats.numOfDifferentLemmas[tool].push(lemmas.length)
            }
    }
    processTool(data,tool,tthis){
        //data
        for (var wid in data) { //words
            // process.stderr.write("\r"+tool+"-"+wid)
            this.processWord(data[wid],wid, tool,tthis)
        }
    }
    process(data) {
        var tool = data[0];
        // console.log("here",tool)
        data = data[1];

        if(/^Raw$/.test(tool)){
            raw = data;
            // this.emit("data","# text="+raw.join(" ")+"\n");
            return undefined;
        }
        else if(/Raw/.test(tool)){
            return undefined;
        }
        else if(/META/.test(tool)){
            if(data.name.split("-")[1] == 1)
                this.emit("data","# newdoc id=surah"+data.name.split("-")[0]+"\n");
            this.emit("data","# sent_id = "+data.name.split("-")[1]+"\n");
            this.emit("data","# text="+raw.join(" ")+"\n");
            this.emit("data","# filename="+data.name+"\n");
            this.emit("data",this.toolsData.join("\n"))
            this.emit("data","\n\n"); // sentence delimeter
            this.toolsData = []
            return undefined;
        }
        if(this.argv.t.indexOf(tool) <0 && (tools[this.argv.t] === undefined || tools[this.argv.t].indexOf(tool) < 0)){
            return undefined;
        }
        /*
        ID: Word index, integer starting at 1 for each new sentence; may be a range for tokens with multiple words.
        FORM: Word form or punctuation symbol.
        LEMMA: Lemma or stem of word form.
        UPOSTAG: Universal part-of-speech tag drawn from our revised version of the Google universal POS tags.
        XPOSTAG: Language-specific part-of-speech tag; underscore if not available.
        FEATS: List of morphological features from the universal feature inventory or from a defined language-specific extension; underscore if not available.
        HEAD: Head of the current token, which is either a value of ID or zero (0).
        DEPREL: Universal dependency relation to the HEAD (root iff HEAD = 0) or a defined language-specific subtype of one.
        DEPS: List of secondary dependencies (head-deprel pairs).
        MISC: Any other annotation.
        */

        // this.emit("data","#TOOL="+tool+"\n");
        if(this.argv.stats){
            this.stats.numOfAnalyses[tool] = []
            this.stats.OOV[tool] = 0
            this.stats.numOfDifferentLemmas[tool] = []
        }
        this.processTool(data,tool,this)

        var obj = {};
        obj[tool] = data;
        return undefined;
    }
}


function main(instream, a){
    argv = a
    if(argv.gold)
        for(var i in tools){
            tools[i].push("QA")
            tools[i].push("SW")
        }

    argv.t = argv.t.split(":")
    let conv = new ConvertToConll(argv)
    if(argv.stats)
        conv.stats = {
            numOfAnalyses:{},
            OOV:{},
            numOfDifferentLemmas:{},
    }

    return instream
        .pipe(es.through(conv.process));
}

function mainOneTool(instream, tool, raw, argv){
    argv.name = argv.name || "1-1"
    argv.stats = false

    // argv.t = argv.t.split(":")
    let conv = new ConvertToConll(argv)

    conv.toolsData = []
    conv.counter = 1
    var counter = 0
    return instream
        .pipe(es.through(function(word) {
            conv.processWord(word,counter++,tool)
            return undefined;
        }, function(){
            this.emit("data","# newdoc id="+argv.name.split("-")[0]);
            this.emit("data","# sent_id = "+argv.name.split("-")[1]);
            this.emit("data",`# text=${raw}`);
            this.emit("data",`# filename=${argv.name}`);
            conv.toolsData.forEach(x=>this.emit("data",x))
            // this.toolsData = []
            conv.counter = 1
            this.emit("data","\n"); // sentence delimeter            
            this.emit("end"); // sentence delimeter            
        }));
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}//http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript

function avg(elmt){
    var sum = 0;
    for( var i = 0; i < elmt.length; i++ ){
        sum += parseInt( elmt[i], 10 ); //don't forget to add the base
    }

    var avg = sum/elmt.length;
    return avg
}


// var argv = {}
if (require.main === module) { // called directly
    var argv = require('yargs')
        .usage('Usage: $0 [-ts] -t ALL|POS|MAN|... [-f filename]')
        .default('f',"/dev/stdin")
        .demand('t').describe('t','Output specific colon-sperated tools, ALL for all, POS for POS taggers, MAN for morphological analysers')
        .describe("sort", "(w)ord, (t)ool, (m)orpheme sort the output by words or by tool")
        .describe("b", "add buckwalter transliteration").default("b", false)
        .describe("c", "only chosed/disambiguated").default("c", true)
        .describe("d", "debug on/off")
        .describe("stats", "Show some statistics")
        .describe("gold", "add gold refernce if available")
        .describe("q", "quiet")
        .boolean("notstrict").describe("notstrict", "Make the file not strict to ConLL-U format")
        .boolean("align").describe("align", "use aligned morphemes instead.")
        .help()
        .argv


    if(argv.t.length == 2){
        var ress =  mainOneTool(fs.createReadStream(argv.f)
            .pipe(JSONStream.parse("*")), argv.t, argv.raw, argv)
            .pipe(es.through(function(data){
                this.emit("data",data+"\n")
            }))
    }
    else{
        var ress = main(fs.createReadStream(argv.f)
            .pipe(JSONStream.parse("*",function(data,key){
                return [key[0],data];
            })), argv)
    }

    ress.on('end',function(){
        if(!argv.stats)
            return;
        console.log("--------------------------");
        for(var i in this.stats){
            for(var j in this.stats[i]){
                if(this.stats[i][j].length!==undefined)
                    if(this.stats[i][j].length===0)
                        this.stats[i][j]=0
                    else
                        this.stats[i][j] = avg(this.stats[i][j])
            }
        }
        console.log(this.stats);
    })
    ress.pipe(process.stdout);
    process.stdout.on('error', process.exit);
}
else{
    
    exports.allTools = {
        toConlluFromFile : function(fileInput, tools, opts){
            // opts.f = fileInput
            opts.t = tools
            return main(
                    fs.createReadStream(fileInput)
                    .pipe(JSONStream.parse("*",function(data,key){
                        return [key[0],data];
                    })), opts)
        },
        toConlluFromJSON : function(input, tools, opts){
            var Readable = require('stream').Readable
            var i = new Readable()
            if(Array.isArray(input))
                input.forEach(x=>i.push(x))
            else
                i.push(input)
            i.push(null) // indicates end-of-file basically - the end of the stream
            if(!opts)
                opts = {}
            opts.t = tools
            return main(i,opts)
        }
    }
    exports.oneTool = {
        toConlluFromInStream : function(input, tool,raw, opts){
            return mainOneTool(input, tool, raw, opts)
        }
    }
}