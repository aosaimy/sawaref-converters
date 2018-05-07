"use strict"
var config = {
    debug: 1,
    tools: {
        // MS: "ATKS Sarf",//
        // MP: "ATKS POS Tagger",//
        KH: "AlKhalil", //
        AR: "AraComLex", //
        EX: "Elixir", //
        MD: "MADA+TOKAN",
        MA: "MADAMIRA",
        MX: "MADAMIRA",
        // QA: "Quranic Arabic Corpus",//
        BP: "Buckwalter Perl", //
        BJ: "AraMorph", //
        ST: "Stanford POS Tagger", //
        // SP: "Stanford Parser",//
        AM: "AMIRA",
        QT: "Qutuf", //
        AL: "ALMORGEANA", //
        XE: "Xerox",
        // FS: "Morfessor",
        MR: "MarMoT",
        WP: "SAPA Wapiti",
        // SW: "Sawalha",//
    },
    "sim": {
        "ngram": 1,
    },
    toolspairs:{
        "AM:FA:QA": "FA:AM:QA",
        "ST:FA:QA": "FA:ST:QA",
        "MX:FA:QA": "FA:MX:QA",
        "ST:AM:QA": "AM:ST:QA",
        "MX:AM:QA": "AM:MX:QA",
        "MX:ST:QA": "ST:MX:QA",

        "AM:FA:ST:QA": "FA:AM:ST:QA",
        "AM:ST:FA:QA": "FA:AM:ST:QA",
        "FA:ST:AM:QA": "FA:AM:ST:QA",
        //"FA:AM:ST:QA": "FA:AM:ST:QA",
        "ST:AM:FA:QA": "FA:AM:ST:QA",
        "ST:FA:AM:QA": "FA:AM:ST:QA",

        // "FA:AM:MX:QA": "FA:AM:MX:QA",
        "FA:MX:AM:QA": "FA:AM:MX:QA",
        "AM:MX:FA:QA": "FA:AM:MX:QA",
        "AM:FA:MX:QA": "FA:AM:MX:QA",
        "MX:AM:FA:QA": "FA:AM:MX:QA",
        "MX:FA:AM:QA": "FA:AM:MX:QA",

        "ST:AM:MX:QA": "AM:ST:MX:QA",
        "ST:MX:AM:QA": "AM:ST:MX:QA",
        "AM:MX:ST:QA": "AM:ST:MX:QA",
        // "AM:ST:MX:QA": "AM:ST:MX:QA",
        "MX:AM:ST:QA": "AM:ST:MX:QA",
        "MX:ST:AM:QA": "AM:ST:MX:QA",
        
        // "ST:MX:FA:AM:QA": "ST:MX:FA:AM:QA",
    },
    toolspairsFn: function(pair){
        if(!pair)
            return ""
        if(pair.split(":").length == 5)
            return "ST:MX:FA:AM:QA";
        else if(config.toolspairs[pair])
            return config.toolspairs[pair]
        else
            return pair
    },
    alltools: [
        "KH",
        "AR",
        "EX",
        "AL",
        "BP",
        "BJ",
        "MS",
        // "QT",

        "MT",
        "MD",
        "MA",
        "MX",
        "ST",
        "MR",
        "WP",
        "AM",
        "FA",

        "QA",
        "SW",
    ],
    dim: 100,
    features: ["aspect", "case", "gender", "voice", "mood", "person", "gloss", "lem", "number", "pos", "prefix", "main", "root", "state", "stem", "suffix", "utf8"],
    pos: {
        MA: ["-----",  "verb", "det", "noun", "conj_sub", "conj", "pron", "part_neg", "part_verb", "pron_rel", "prep", "3mp_poss", "noun_prop", "1p_dobj", "verb_pseudo", "3ms_poss", "3mp_pron", "2fs_poss", "1s_pron", "2ms_pron", "3ms_pron", "3d_dobj", "2mp_poss", "2mp_dobj", "emph", "2mp_pron", "1p_poss", "rel", "part", "3ms_dobj", "3fs_dobj", "adv", "pron_dem", "adj", "1s_poss", "3fs_pron", "3fs_poss", "interj", "3mp_dobj", "1p_pron", "rc", "2fs_dobj", "2ms_dobj", "part_fut", "ques", "punc","1s_dobj", "digit","3d_pron","3d_poss","neg","fut","2ms_poss","part_det","part_interrog","part_voc","pron_interrog"],
        
        MX: ["-----",  "verb", "det", "noun_quant", "noun","2fs_pron", "conj_sub", "conj", "pron", "part_neg", "part_verb", "pron_rel", "prep", "3mp_poss","2d_pron","2d_poss", "noun_prop", "1p_dobj", "verb_pseudo", "3ms_poss", "3mp_pron", "2fs_poss", "1s_pron", "2ms_pron", "3ms_pron", "3d_dobj", "2mp_poss", "2mp_dobj", "emph", "2mp_pron", "1p_poss", "rel", "part", "3ms_dobj", "3fs_dobj", "adv", "pron_dem", "adj", "1s_poss", "3fs_pron", "3fs_poss", "interj", "3mp_dobj", "1p_pron", "rc", "2fs_dobj", "2ms_dobj", "part_fut", "ques", "punc","1s_dobj", "digit","3d_pron","3d_poss","neg","fut","2ms_poss","part_det","part_interrog","part_voc","pron_interrog","3fp_dobj","3fp_poss","3fp_pron","abbrev","adv_interrog","interrog","sub","pron_exclam","part_focus","adv_rel"],

        AM: ["-----", "DET", "UH","NN", "WP", "VBP",  "PUNC", "CC", "PRP", "RP", "VBD", "IN", "NNP", "NNS", "JJ", "VN", "NNCD", "VBG", "WRB", "DT", "NQ", "VBN", "CJP", "VB", "FP","RB","JJCD","JJR"],

        FA: ["-----",  "V", "DET", "NOUN", "PART", "PRON", "CONJ", "PREP", "NSUFF", "ADJ", "CASE", "NUM", "FOREIGN", "FUT_PART", "PUNC" ,"ADV","ABBREV"],

        ST: ["-----",  "VBP", "DTNN","DTNNS","DTJJ","DTJJR","DTNNP","DT", "NN", "IN", "CC", "PRP", "RP", "WP", "PRP$", "NNP", "VBD", "NNS", "JJ", "JJR", "VN", "CD", "NOUN", "VBN", "WRB", "VBG", "VB", "NNPS", "NOUN_QUANT", "PUNC","RB","ADJ","UH","JJCD"],

        QA: ["-----",  "INL","AVR","IMPN", "INTG", "V", "DET", "N", "SUB", "PRON", "CONJ", "NEG", "EMPH", "CERT", "REL", "P", "PN", "REM", "ACC", "ADJ", "PREV", "COND", "PRP", "T", "LOC", "SUP", "IMPV", "RES", "CIRC", "DEM", "PRO", "VOC", "AMD", "SUR", "RET", "EXH", "FUT","ANS", "COM","EXL","EXP","INC","INT","RSLT","EQ","CAUS"]
    },
    QAClosedTags: ["INL", "INTG",  "DET", "SUB", "PRON", "CONJ", "NEG", "EMPH", "CERT", "REL", "P", "-----", "REM", "ACC", "PREV", "COND", "PRP", "T", "LOC", "SUP", "IMPV", "RES", "CIRC", "DEM", "PRO", "VOC", "AMD", "SUR", "RET", "EXH", "FUT","ANS", "COM","EXL","EXP","INC","INT","RSLT","EQ","CAUS"],
    FAClosedTags: ["DET","PART", "PRON", "CONJ", "PREP", "NSUFF", "CASE", "NUM", "FUT_PART", "PUNC","ADV"],
    QAclosedSetWords: ["ال","الذين","الذي","يا","التي","ني","إياي","هي","آن","الل","ثلاثة","آخر","وون","لذي","آناء","اللاتي","اللذان","أربعين","ذلك","ٱل","لا","في","ه","ل","ٱلذين","ون","ب","و","م","ما","ن","هم","إلي","ك","من","أولئك","على","إن","وا","علي","ء","ت","أم","لم","نا","إلا","فى","ف","إذا","نحن","ألا","لكن","أ","إلى","ا","مع","كم","ٱلذى","لما","حول","أو","كلما","لو","ي","لعل","أنتم","تم","لن","ٱلتى","ها","أن","هذا","فوق","أما","ماذا","كيف","ثم","هو","هن","إذ","ى","نى","هؤلاء","أنت","حيث","تما","هذه","هما","عن","إما","إيى","ذلكم","عند","حتى","س","قد","لولا","بين","خلف","هى","ـن","ع","لذين","بلى","يوم","بل","وراء","أبدا","كأن","ان","تلك","أينما","ئن","بعد","شطر","أين","ئ","أنا","إياه","قبل","حين","أياما","ليلة","تمو","هل","متى","أنى","حولين","ذا","تا","هنالك","ثلثة","لدي","أي","وجه","ءاخر","لذى","ءاناء","أولاء","إين","كيلا","هنا","يومئذ","ٱلذان","سوف","دون","ليت","كل","أولئكم","إياكم","ئلا"],
    "mood": {
        QA: ["IND","SUBJ","JUS"],
        /******************
        *** NOTE! Arff now use mapped value, so no need to configure these.
        See the button
        ******************/
        MA: ["i","s","j","na","u"],
        MX: ["i","s","j","na","u"],
        AM: [],
        FA: [],
        ST: [],
        SW: ["n","a","j"]
    },
    "aspect": {
        MA: ["i","c","p","na"],
        MX: ["i","c","p","na"],
        QA: ["IMPF","PERF","IMPV"],
        AM: ["imperfect","imperative","perfect"],
        FA: [],
        ST: ["imperfect","imperative","perfect"],
        SW: ["p","c","i"]
    },
    "gender": {
        MA: ["m","f","na"],
        MX: ["m","f","na"],
        QA: ["M","F"],
        AM: [],
        FA: [],
        ST: [],
        SW: ["m","f","x"]
    },
    "person": {
        MA: ["1","2","3","na"],
        MX: ["1","2","3","na"],
        QA: ["1","2","3"],
        AM: ["1","2","3"],
        FA: ["1","2","3"],
        ST: ["f","s","t"]
    },
    "number": {
        MA: ["s","d","p","na"],
        MX: ["s","d","p","na"],
        QA: ["S","D","P"],
        AM: [],
        FA: [],
        ST: ["plural","dual","singular"],
        SW: ["s","d","p"]
    },
    "case": {
        MA: ["u","a","g","n","na"],
        MX: ["u","a","g","n","na"],
        QA: ["ACC","GEN","NOM"],
        AM: [],
        FA: [],
        ST: [],
        SW: ["n","a","g"]
    },
    "voice": {
        MA: ["a","p","na"],
        MX: ["a","p","na"],
        QA: ["ACT","PASS"],
        AM: ["active","passive"],
        FA: [],
        ST: ["active","passive"],
        SW: ["a","p"]
    },
    "state": {
        MA: ["i","d","c","na"],
        MX: ["i","d","c","na"],
        QA: ["INDEF","DEF"],
        AM: [],
        FA: [],
        ST: [],
        SW: ["d","i"]
    },
}

config.pos.MX = config.pos.MX.concat(["poss","dobj"])
config.mood.QA = config.mood.QA.concat(["u"])
var arr = ["mood","aspect","gender","person","number","case","voice","state"]
var arr2 = ["MA","MX","AM","FA","ST"]
arr.forEach(x=>{
    // config[x].QA.push("-")
    config[x].QA.push("-----")
    arr2.forEach(y=>{
        config[x][y] = config[x].QA
        config[y+x] = config[x].QA
    })
})
arr.forEach(x=>{
    config["QA"+x] = config[x].QA
})

Object.keys(config.pos).forEach(x=>{
    config[x+"pos"] = config.pos[x]
})
module.exports = config;

