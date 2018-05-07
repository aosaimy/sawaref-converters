"use strict"
var chalk = require('chalk');
var include = {
    basicTaskeel: function(str) {
        return str.replace(/aA/g, "A") // َا -> ا
            .replace(/FA/g, "AF") // ًا -> اً
            .replace(/uw/g, "w") // ُو -> و
            .replace(/iy/g, "y") // ِي -> ي
            .replace(/o/g, "") // ْ -> "
            .replace(/<i/g, "<") // إِ -> إ
            .replace(/Ya/g, "Y") // ىَ -> ى
            .replace(/aY/g, "Y") // َى -> ى
            .replace(/a~/g, "~a") // َّ -> َّ
            .replace(/i~/g, "~i") // ِّ -> ِّ
            .replace(/u~/g, "~u") // ُّ -> ُّ
            //errors
            //duplicates
            .replace(/aa/g, "a") // ََ -> َ
            .replace(/ii/g, "i") // ِِ -> ِ
            .replace(/uu/g, "u") // ُُ -> ُ
            .replace(/~~/g, "~") // ّّ -> ّ
            // incopmatible
            .replace(/Aa/g, "A") // اَ -> ا
            .replace(/Ai/g, "A") // اِ -> ا
            .replace(/Au/g, "A") // اٌ -> ا
            .replace(/<[au]/g, "<") // إَُ -> إ
            .replace(/>i/g, ">") // إَُ -> إ
    },
    removeFinalTaskeel: function(str) {
        return str
            .replace(/~[aiu] /g, "") // َّ -> 
            .replace(/[aiu] /g, "") // ّ -> 
            .replace(/[FNK] /g, "") // ّ -> 
    },
    getEditDistance: (a, b) => {
        if ((!a || a.length === 0) && (!b || b.length === 0)) return 0;
        if (!a || a.length === 0) return b.length;
        if (!b || b.length === 0) return a.length;

        var matrix = [];

        // increment along the first column of each row
        var i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        var j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1)); // deletion
                }
            }
        }
        return matrix[b.length][a.length];
    }, //http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance
    stringalign: (ain, bin, mispen, gappen, skwpen) => {
        var i, j, k;
        var dn, rt, dg;
        var ia = ain.length,
            ib = bin.length;
        var aout = []; // .resize(ia+ib);
        var bout = [];
        var summary = [];

        var cost = [];
        var marked = [];
        for (let n = 0; n < ia + 1; ++n) {
            cost[n] = new Array(ib + 1);
            marked[n] = new Array(ib + 1);
        }

        cost[0][0] = 0.0;
        for (i = 1; i <= ia; i++) cost[i][0] = cost[i - 1][0] + skwpen;
        for (i = 1; i <= ib; i++) cost[0][i] = cost[0][i - 1] + skwpen;
        for (i = 1; i <= ia; i++)
            for (j = 1; j <= ib; j++) {
                // dn = cost[i - 1][j] + ((j == ib) ? skwpen : gappen);
                // rt = cost[i][j - 1] + ((i == ia) ? skwpen : gappen);
                dn = cost[i - 1][j] + ((j == ib) ? skwpen : gappen);
                //  getEditDistance(ain[i - 1], ain[i - 1]));
                rt = cost[i][j - 1] + ((i == ia) ? skwpen : gappen);
                //  getEditDistance(bin[j - 1], bin[j - 1]));
                dg = cost[i - 1][j - 1] + include.getEditDistance(ain[i - 1], bin[j - 1]) //+ ((ain[i - 1] == bin[j - 1]) ? -1. : mispen);
                cost[i][j] = Math.min(dn, rt, dg);
            }
        i = ia;
        j = ib;
        k = 0;
        while (i > 0 || j > 0) {
            marked[i][j] = 1;
            dn = rt = dg = 9.99e99;
            // if (i > 0) dn = cost[i - 1][j] + ((j == ib) ? skwpen : gappen);
            // if (j > 0) rt = cost[i][j - 1] + ((i == ia) ? skwpen : gappen);
            if (i > 0) dn = cost[i - 1][j] + ((j == ib) ? skwpen : gappen);
            //  getEditDistance(ain[i - 1], ain[i - 1]));

            if (j > 0) rt = cost[i][j - 1] + ((i == ia) ? skwpen : gappen);
            //  getEditDistance(bin[j - 1], bin[j - 1]));

            if (i > 0 && j > 0)
                // dg = cost[i - 1][j - 1] + ((ain[i - 1] == bin[j - 1]) ? -1. : mispen);
                dg = cost[i - 1][j - 1] + include.getEditDistance(ain[i - 1], bin[j - 1])
            if (dg <= Math.min(dn, rt)) {
                aout[k] = ain[i - 1];
                bout[k] = bin[j - 1];
                summary[k++] = ((ain[i - 1] == bin[j - 1]) ? '=' : '!' + include.getEditDistance(ain[i - 1], bin[j - 1]));
                i--;
                j--;
            } else if (dn < rt) {
                aout[k] = ain[i - 1];
                bout[k] = ' ';
                summary[k++] = ' ';
                i--;
            } else {
                aout[k] = ' ';
                bout[k] = bin[j - 1];
                summary[k++] = ' ';
                j--;
            }
            marked[i][j] = 1;
        }
        for (i = 0; i < k / 2; i++) {
            var t = aout[k - 1 - i];
            aout[k - 1 - i] = aout[i];
            aout[i] = t;

            t = bout[k - 1 - i];
            bout[k - 1 - i] = bout[i];
            bout[i] = t;

            t = summary[k - 1 - i];
            summary[k - 1 - i] = summary[i];
            summary[i] = t;
        }
        aout.size = k;
        bout.size = k;
        summary.size = k;


        //brilliant DO NOT REMOVE IT 
        if (false) {
            var table = "";
            table += "\t";
            table += bin.join("\t")
            table += "\n";
            for (let n = 0; n < cost.length; ++n) {
                table += "\n";
                if (n < cost.length - 1)
                    table += "" + ain[n] + "\t";
                else
                    table += "\t";
                for (let m = 0; m < cost[n].length; ++m) {
                    if (marked[n][m] == 1) {
                        table += chalk.green(cost[n][m].toFixed(2)) + "\t";
                    } else
                        table += cost[n][m].toFixed(2) + "\t";
                }
                table += "\n";
            }
            console.error(table);
        }
        return {
            a: aout,
            b: bout,
            s: summary
        };
    }
}
module.exports = include