const ToolExecutor = require("./src/ai/services/toolExecutor.service");

async function test() {
  console.log("Available Tools:");
  console.log(ToolExecutor.getAvailableTools());

  console.log("\nDashboard Test:");
  console.log(await ToolExecutor.execute("dashboard"));

  console.log("\nLead Test:");
  console.log(
    await ToolExecutor.execute("lead", {
      leadId: 10,
    })
  );

  console.log("\nInvalid Tool Test:");
  console.log(await ToolExecutor.execute("email"));
}

test();