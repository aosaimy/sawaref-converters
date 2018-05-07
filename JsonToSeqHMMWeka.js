console.log("THIS IS NOT STABLE! DO NOT USE")
var config = require('./config');
var argv = require('yargs')
    .usage('Usage: JsonToCsv.js -t byTool')
    .describe("f", "path of input file")
    .default('f',"/dev/stdin")
    .demand('t').describe('t','byTool or byFeature')
    .demand('raw').describe('raw','which raw to use as input')
    .describe("feat", "pos or any other supported feature:"+config.features.join(","))
    .default("feat","pos")
    .boolean("m").describe("m", "morpheme-based conversion, word-based otherwise")
    .boolean("showErrors").describe("showErrors", "")
    .boolean("showWord").describe("showWord", "")
    .describe("arff", "use same header of this arff file")
    .argv

var csv_stringify = require('csv-stringify');
var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs');
var line = {
    tool: "",
    chapter: "",
    ayah: "",
    wordpos: "",
    type: "",
    analysisId: 0,

    aspect: "",
    "case": "",
    gender: "",
    voice: "",
    mood: "",
    person: "",

    gloss: "",
    lem: "",

    number: "",
    //orig: "",

    pos: "",
    prefix: "",
    main: "",
    root: "",
    state: "",
    stem: "",
    suffix: "",
    utf8: "",
}


if(config.features.indexOf(argv.feat)<0){
    console.error("Feature requested:",argv.feat," is not supported")
    console.error("Features supported:",config.features.join(","))
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

for(var i in tools){
    line2[i] = "-";
}
columns = [];
if(argv.d){
    columns.push("0-index")
    // columns.push("word")
}
if(argv.showWord){
    // columns.push("word")
}

columns.push("seq");
columns.push("QA");

var stringifier = csv_stringify({
        columns: columns,
        header: argv.arff ? false : true,
        quoted: argv.arff ? false : true,
        quotedString: argv.arff ? false : true,
    })
stringifier.pipe(process.stdout);

var arr =[]
var morphemes =[]
var raw1 =""
var myapp = {
    usealignment: function(data, key) {
            if(key[0]=="META"){                    
                // console.error(arr)
                // console.error(morphemes)
                Object.keys(morphemes).forEach(m=>morphemes[m].forEach((v,i)=>v.forEach((vv,j)=>{
                        if(!arr[i+"-"+j]){
                            if(!morphemesutf[i])
                                console.error(data.name,m,v,i,vv,j)
                            arr[i+"-"+j] = {
                                "0-index":[data.name,i+1,j+1].join("-"),
                                "c":(i+1)*100+(j+1), // compare
                                "word":morphemesutf[i][j] || "''",
                            }

                            // arr[i+"-"+j][argv.arff] = "?"
                            if(argv.notaligned)
                                tools.forEach(t=>arr[i+"-"+j][t]="-----")
                            else
                                tools.forEach(t=>arr[i+"-"+j][t]="?")
                        }
                        if(vv!="E")
                            // if(vv!="-----")
                            arr[i+"-"+j][m] = vv
                        
                        if(vv=="E" && argv.showErrors)
                            arr[i+"-"+j][m] = vv

                        if(config[argv.feat][m].indexOf(vv)<0 && vv!="E" && vv!=undefined && vv!="-----")
                            console.error("Nominal value not declared in config.js: Tool=",m," Value=",vv," Feature=",argv.feat)
                    })))
                result = []
                // console.error(arr)
                Object.keys(arr).sort((a,b)=>arr[a].c-arr[b].c).forEach(m=>{
                    if(Object.keys(arr[m]).map(mm=>mm.length==2?arr[m][mm]:"").join("-").replace(/[?-]/g,"")!=""){
                        if(config.closedSetWords.indexOf(arr[m]["word"]) >= 0){
                            // do not do anything
                        }
                        else if(argv.showWord && allwords.indexOf(arr[m]["word"]) < 0 && config.FAClosedTags.indexOf(arr[m]["FA"]) > 0){
                            allwords.push(arr[m]["word"])
                            allwordspos.push(arr[m]["word"]+arr[m]["QA"])
                        }
                        else
                            arr[m]["word"] = "''"
                        if(argv.arff || arr[m]["QA"]!="?")
                            result.push(arr[m])
                    }
                            
                })

                // }
                arr =[]
                morphemes =[]
                return result;
            }
            //case alignment is based on non-seg input, diac input or input segmented using FA)
            else if(key[0] == "Raw" || key[0] == "RawDia" || key[0] == "RawSeg" ){
                if(key[0]=="RawSeg"){
                    raw1 = data;
                }
            }
            else if(tools.indexOf(key[0]) < 0)
                return;
            else if (!data || data.error){
                // console.error(data);
            }
            else{
                // if (!data.analyses)
                //     console.error(data,key[0]);
                if(!argv.showErrors)
                    morphemes[key[0]] = data.map(d=>{
                        return d.error ? [] : d.analyses[d.choice].al_morphemes.map(m=>m[argv.feat])
                    })
                else{
                    morphemes[key[0]] = data.map(d=>{
                        return d.error ? [] : d.analyses[d.choice].al_morphemes.map(m=>{
                            if(m[argv.feat] == "E" && m.orig != "-----" && !m.orig)
                                console.error(key[0],m,d)
                            try{
                                return m[argv.feat] == "E" ? (m.orig == "-----" ? m.orig : m.orig[argv.feat]) : m[argv.feat]
                            }
                            catch(e){
                                console.error("m,m.orig=",m,m.orig)
                                console.error(e)
                            }
                        }
                        )
                    })
                    if(key[0]=="FA"){
                        morphemesutf = data.map(d=>{
                            return d.error ? [] : d.analyses[d.choice].al_morphemes.map(m=>{
                                try{
                                    return m[argv.feat] == "E" ? (m.orig == "-----" ? "" : "") : m.utf8
                                }
                                catch(e){
                                }
                            })
                        })
                    }
                }
                
                
            }
    },
    batcher: function(data){
        for(var i = 0; i < data.length; i++){
            var batch = []
            for(var j = 4; j >= 0; j--)
                if(i-j >= 0){
                    var row = []
                    row.push(data[i-j].word)
                    for(var t of tools)
                        if(t!="QA")
                            row.push(data[i-j][t])
                    batch.push(row.join(","))
                }
            var obj = {
                word: data[i].word,
                seq: batch.join("\\n"),
                QA: data[i].QA,
                "0-index": data[i]["0-index"]
            }
            stringifier.write(obj)
        }
    }
}
morphemesutf = []
allwords = []
allwordspos = []

if(argv.arff){
    // fs.createReadStream(argv.arff)
    //     .pipe(es.split("\n"))
    //     .pipe(es.through(function(data){
    //         if(data[0]=="@")
    //             // if( ! /\@attribute (QA|SW)/.test(data))
    //                 this.emit("data",data+"\n")
    //     },d=>{
    console.log("@relation",argv.name || "tmp")
    if(argv.d){
        console.log("@attribute","0-index","string")
        // console.log("@attribute","word","string")
    }
    console.log("@attribute","seq","relational")

    if(argv.showWord){
        console.log("  @attribute","word","{",config.closedSetWords.join(","),"}")
    }

    for(var t of tools){
        if(t!="QA")
            console.log("  @attribute",t,"{",config[argv.feat][t].join(","),"}")
    }
    console.log("@end seq")
    console.log("@attribute","QA","{",config[argv.feat]["QA"].join(","),"}")
    console.log("@data")

    
    var ress = fs.createReadStream(argv.f)
        .pipe(JSONStream.parse("*",myapp.usealignment))
        .pipe(es.through(myapp.batcher))

        // }))
        // .pipe(JSONStream.stringify())
        // .pipe(process.stdout);
}
else
    var ress = fs.createReadStream(argv.f)
        .pipe(JSONStream.parse("*", myapp.usealignment))

ress.on("end",function(){
    console.error("allwords",JSON.stringify({"allwords":allwords}))
    // console.error("allwords",JSON.stringify({"morphemesutf":morphemesutf}))
})
process.stdout.on('error', process.exit);
