const LeadAction =
require("./src/ai/actions/lead.actions");

async function test(){

const result=

await LeadAction.bulkAssign({

category:"Healthcare",

assignee:"Mickey"

});

console.log(result);

}

test();