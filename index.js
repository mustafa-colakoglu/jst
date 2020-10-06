const fs = require("fs");
const util = require("util");

const exec = require("child_process").exec;
const readFile = util.promisify(fs.readFile);
const _eval = require("eval");
(async() => {
    const index = await (await readFile("./index.jst")).toString();
    const split = index.split("?>");
    let output = "test";
    const test = _eval(`output="5"`, undefined, {output}, true);
    console.log(output);
    return;
    // cmd.on("disconnect", (a,b) => console.log(a,b))
    // cmd.on("close", (a,b,c) => console.log("closed",a,b, c))
    // // cmd.on("error", (a,b) => console.log(a,b))
    // cmd.on("exit", (a,b,c) => console.log("exited", a,b,c))
    // cmd.on("message", (a,b) => console.log(a,b))
    const print = (text) => {
        output += text;
    }
    for(let i=0; i < split.length; i++){
        let temp = split[i];
        const split2 = temp.split("<?jst");
        output += split2[0];
        if(split2.length === 2){
            const temp2 = split2[1].trim();
            // const emit = cmd.emit(temp2);
        }
        // if(temp.startsWith("<?jst")){
        //     temp = temp.substr("<?jst".length, temp.length).trimStart();
        //     console.log(temp);
        //     eval(temp);
        // }
    }
    // console.log(output);
})();