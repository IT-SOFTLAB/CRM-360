const { parseDate } = require("./src/ai/utils/dateParser");

console.log("Today:");
console.log(parseDate("today"));

console.log("----------------");

console.log("Tomorrow:");
console.log(parseDate("tomorrow"));

console.log("----------------");

console.log("Friday:");
console.log(parseDate("Friday"));