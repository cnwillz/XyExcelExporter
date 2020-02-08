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
function handleFile(fileDir) {
	var content = fs.readFileSync(fileDir, 'utf8');
	console.log(fileDir);
	var outStr = JSON.stringify(lua2json.parse('return {' + content + '}'));
	countExport++;
	var exportFile = outDir + '/' + countExport + '.json';
	mkdirs(path.dirname(exportFile));
	fs.writeFileSync(exportFile, outStr, 'utf-8');
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
		if(isFile){
			//console.log(filedir);
			handleFile(filedir);
		}
		if(isDir){
			handleDir(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
		}
		
	});
}
handleDir(srcDir);