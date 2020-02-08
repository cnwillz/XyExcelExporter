'use strict'
var lua2json = require('lua-json')
var fs = require('fs')
var path = require('path')

var options = process.argv;
if(options.length < 4)
{
	console.log("需要2个参数(src out)");
	process.exit();
}

var srcDir = options[2];
var outDir = options[3];
var lang = {};

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

function insertStr(soure, start, newStr){   
   return soure.slice(0, start) + newStr + soure.slice(start);
}

function encodeQuote(str) {
	if(str[0] != '"' || str[str.length-1] != '"')
		return str;
	var i = 1;
	var f;
	while((f = str.indexOf('"', i)) != -1 && f < str.length - 1) {
		str = insertStr(str, f, '\\');
		//console.log(f, str);
		i = f + 2;
	}
	return str;
}

var countExport = 0;
function handleFile(fileDir) {
	var content = fs.readFileSync(fileDir, 'utf8');
	content = content.replace(/(LAN.\w+.\w+)/g, function ($0, $1){
		var str = $1;
		//console.log(str);
		str = `"${lang[str]}"`;
		str = encodeQuote(str);
		//console.log($1, str);
		return str;
	} );
	//return;
	//console.log(content);
	//var exportFile1 = 'out_test/' + countExport + '.lua';
	//mkdirs(path.dirname(exportFile1));
	//fs.writeFileSync(exportFile1, content, 'utf-8');
	
	var outStr = JSON.stringify(lua2json.parse(`return {${content}}`));
	countExport++;
	var exportFile = outDir + '/' + countExport + '.json';
	console.log(fileDir, '->', exportFile);
	mkdirs(path.dirname(exportFile));
	fs.writeFileSync(exportFile, outStr, 'utf-8');
}

function handleLanguage(fileDir) {
	console.log('lang:' + fileDir);
	var content = fs.readFileSync(fileDir, 'utf8');
	//console.log(content);
	var obj = lua2json.parse(`return {${content}}`);
	//console.log(obj);
	for (var key in obj) {
		//console.log(key);
		for (var key2 in obj[key]) {
			lang[`LAN.${key}.${key2}`] = obj[key][key2].replace(/\n/g, '\\n');
		}
	}
	//console.log(Object.keys(lang).length);
}

function handleDir(filePath, callback, except){
    //根据文件路径读取文件，返回文件列表
    var files = fs.readdirSync(filePath);
	//遍历读取到的文件列表
	files.forEach(function(filename){
		if(except != undefined && filename.includes(except))
			return;
		//获取当前文件的绝对路径
		var filedir = path.join(filePath,filename);
		//根据文件路径获取文件信息，返回一个fs.Stats对象
		var stats = fs.statSync(filedir);
		var isFile = stats.isFile();//是文件
		var isDir = stats.isDirectory();//是文件夹
		if(isFile){
			//console.log(filedir);
			callback(filedir);
		}
		if(isDir){
			handleDir(filedir, callback, except);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
		}
		
	});
}


console.log('importing language');
handleDir(`${srcDir}/language/lang`, handleLanguage);
console.log('imported language item:', Object.keys(lang).length);

handleDir(srcDir, handleFile, 'language');

