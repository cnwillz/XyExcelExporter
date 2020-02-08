'use strict'
var XLSX = require('xlsx');
var fs = require('fs');
var path = require('path');

var options = process.argv;
if(options.length < 5)
{
	console.log("需要3个参数(side src out)");
	process.exit();
}
//console.log(options[2], options[3], options[4]);
var side = options[2];
var sideChar = '';
if(side == 'server')
	sideChar = 's';
else if(side == 'client')
	sideChar = 'c';
else {
	console.log("side should be server/client");
	process.exit();
}

var srcDir = options[3];
var outDir = options[4];

console.log("Xy导表脚本 XyExcelExporter");
console.log("作者: willz[qq3243309346]");

var keys = {};
//var values = [];
var attrExport = [];
var currentSheet = null;

function isJson(obj) {
	var isJson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
	return isJson;
}

function insertKey(list, line) {
	var obj = keys;
	for(var i = 0; i < list.length; i++) {
		if(!obj.hasOwnProperty(list[i])) {
			obj[list[i]] = {};
		}
		if(i == list.length - 1)
			obj[list[i]] = line;
		else
			obj = obj[list[i]];
	}
}


function getCell(sheet, row, col) {
	var ref = XLSX.utils.encode_cell({c:col,r:row});
	var cell = sheet[ref];
	return (cell ? cell.v : undefined);
}


function handleValues(obj, numAttr, prefix) {
	var str = '';
	for (var key in obj) {
		str += prefix + '[' + key + '] = {\n';
        var val = obj[key];
		if(isJson(val)) {
			str += handleValues(val, numAttr, prefix + '\t');
		} else {
			for(var ai = 0; ai < numAttr; ai++) {
				if(!attrExport[ai])
					continue;
				var value = getCell(currentSheet, 7 + val, 1 + ai);
				if(value != undefined)
					str += '\t' + prefix + getCell(currentSheet, 6, 1 + ai) + ' = ' + value + ',\n';
			}
		}
		str += prefix + '},\n';
    }
	return str;
}


function mkdirs(dirname, callback) {
    if(fs.existsSync(dirname)) { 
		if(callback != undefined)
			callback();
	} else {
		mkdirs(path.dirname(dirname), function() {
			fs.mkdirSync(dirname);
			if(callback != undefined)
				callback();
		});  
	}    
}

var countExport = 0;
function handleFile(filePath){
	var workbook = XLSX.readFile(filePath);
	//console.log(workbook);
	console.log("handle file: "+ filePath + " with " + workbook.SheetNames.length + " sheets");
	for(var s = 0; s < workbook.SheetNames.length; s++) {
		var sname = workbook.SheetNames[s];
	 
		var sheet = workbook.Sheets[sname];
		//console.log(sheet);
	
		var exportType = getCell(sheet, 0, 1);
		if(exportType == 'base') {
			var exportFile = outDir + '/' + getCell(sheet, 1, 1);
			console.log("exporting sheet '" + sname +
			"' with type " + exportType+
			" to '" + exportFile + "'"
			);
			var fileHead = getCell(sheet, 0, 4);
			var fileTail = getCell(sheet, 1, 4);
			var numKeys = getCell(sheet, 2, 1);
			//console.log(exportFile, fileHead, fileTail, numKeys);
			mkdirs(path.dirname(exportFile));
			var outLua = fileHead + '\n';
			
			var lines = 0;
			for(var lines = 0; true;) {
				if(getCell(sheet, 7+ lines, 1) == undefined)
					break;
				lines++;
			}
			//console.log("line:" + lines);
			//if(lines == 0)
			//	continue;
			
			keys = null;
			keys = {};
			for(var li = 0; li < lines; li++) {
				var list = [];
				for(var ki = 0; ki < numKeys; ki++) {
					list[ki] = getCell(sheet, 7 + li, 1 + ki);
				}
				insertKey(list, li);
			}
			//console.log(keys);
			
			attrExport = [];
			var numAttr = 0;
			var validAttr = 0;
			for(var numAttr = 0; true;) {
				if(getCell(sheet, 6, 1 + numAttr) == undefined)
					break;
				
				var exportParam = getCell(sheet, 5, 1 + numAttr);
				if(exportParam.includes(sideChar)) {
					attrExport[numAttr] = true;
					validAttr++;
				}
				else
					attrExport[numAttr] = false;
				
				numAttr++;
			}
			//console.log(attrExport);
			//console.log("attr:" + numAttr);
			
			currentSheet = sheet;
			
			if(validAttr > 0)
				outLua += handleValues(keys, numAttr, '');;
			
			outLua += fileTail;
			fs.writeFileSync(exportFile, outLua, 'utf-8');
			countExport++;
		}
		else if(exportType == 'tiny') {
			var exportFile = outDir + '/' + getCell(sheet, 1, 1);
			console.log("exporting sheet '" + sname +
			"' with type " + exportType+
			" to '" + exportFile + "'"
			);
			
			var fileHead = getCell(sheet, 0, 4);
			var fileTail = getCell(sheet, 1, 4);
			mkdirs(path.dirname(exportFile));
			var outLua = fileHead + '\n';
			
			var lines = 0;
			for(var lines = 0; true;) {
				if(getCell(sheet, 5+ lines, 1) == undefined)
					break;
				lines++;
			}
			//console.log("line:" + lines);
			//if(lines == 0)
			//	continue;
			
			for(var li = 0; li < lines; li++) {
				var exportParam = getCell(sheet, 5 + li, 1);
				if(!exportParam.includes(sideChar))
					continue;
				outLua += '\t' + getCell(sheet, 5 + li, 2)
				+ ' = ' + getCell(sheet, 5 + li, 3) + ',\n';
			}
			
			
			outLua += fileTail;
			fs.writeFileSync(exportFile, outLua, 'utf-8');
			countExport++;
		}
	}
}

function handleDir(filePath){
    //根据文件路径读取文件，返回文件列表
    var files = fs.readdirSync(filePath);
	//遍历读取到的文件列表
	files.forEach(function(filename){
		//获取当前文件的绝对路径
		var filedir = path.join(filePath,filename);
		//根据文件路径获取文件信息，返回一个fs.Stats对象
		var stats = fs.statSync(filedir);
		var isFile = stats.isFile();//是文件
		var isDir = stats.isDirectory();//是文件夹
		if(isFile && filedir.endsWith(".xlsx")){
			//console.log(filedir);
			handleFile(filedir);
		}
		if(isDir){
			handleDir(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
		}
		
	});
}
handleDir(srcDir);
console.log("Total export: " + countExport);