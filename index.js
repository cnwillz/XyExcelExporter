var xlsx = require('xlsx');
var encoding = require("encoding");

console.log("导出表格");
var workbook = xlsx.readFile("excel\\test.xlsx");

var first_sheet_name = workbook.SheetNames[0];
var address_of_cell = 'A1';
 
/* Get worksheet */
var worksheet = workbook.Sheets[first_sheet_name];
 
/* Find desired cell */
var desired_cell = worksheet[address_of_cell];
 
/* Get the value */
var desired_value = (desired_cell ? desired_cell.v : undefined);

console.log(desired_value);