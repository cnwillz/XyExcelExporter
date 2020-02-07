var XLSX = require('xlsx');
var fs = require('fs');
var path = require('path');

console.log("Xy导表脚本 XyExcelExporter");
console.log("作者: willz[qq3243309346]");

var keys = {};
var values = [];

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

function handleValues(obj, prefix) {
	var str = '';
	for (var key in obj) {
		str += prefix + '[' + key + '] = {\n';
        var val = obj[key];
		if(isJson(val)) {
			str += handleValues(val, prefix + '\t');
		} else {
			var lo = values[val];
			for (var ik in lo) {
				str += '\t' + prefix + ik + ' = ' + lo[ik] + '\n';
			}
		}
		str += prefix + '},\n';
    }
	return str;
}



function getCell(sheet, row, col) {
	var ref = XLSX.utils.encode_cell({c:col,r:row});
	var cell = sheet[ref];
	return (cell ? cell.v : undefined);
}

function mkdirs(dirname, callback) {  
    fs.exists(dirname, function (exists) {  
        if (exists) {  
            callback();  
        } else {  
            //console.log(path.dirname(dirname));  
            mkdirs(path.dirname(dirname), function () {  
                fs.mkdir(dirname, callback);  
            });  
        }  
    });  
}

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
			var exportFile = 'out\\' + getCell(sheet, 1, 1);
			console.log("exporting sheet '" + sname +
			"' with type " + exportType+
			" to '" + exportFile + "'"
			);
			var fileHead = getCell(sheet, 0, 4);
			var fileTail = getCell(sheet, 1, 4);
			var numKeys = getCell(sheet, 2, 1);
			//console.log(exportFile, fileHead, fileTail, numKeys);
			mkdirs(path.dirname(exportFile), function(){});
			var outLua = fileHead + '\n';
			
			var lines = 0;
			for(var lines = 0; true;) {
				if(getCell(sheet, 7+ lines, 1) == undefined)
					break;
				lines++;
			}
			//console.log("line:" + lines);
			if(lines == 0)
				continue;
			
			keys = {};
			for(var li = 0; li < lines; li++) {
				var list = [];
				for(var ki = 0; ki < numKeys; ki++) {
					list[ki] = getCell(sheet, 7 + li, 1 + ki);
				}
				insertKey(list, li);
			}
			//console.log(keys);
			
			var numAttr = 0;
			for(var numAttr = 0; true;) {
				if(getCell(sheet, 6, 1 + numAttr) == undefined)
					break;
				numAttr++;
			}
			//console.log("attr:" + numAttr);
			
			values = [];
			for(var li = 0; li < lines; li++) {
				values[li] = {};
				var obj = values[li];
				for(var ai = 0; ai < numAttr; ai++) {
					var attr = getCell(sheet, 6, 1 + ai);
					obj[attr] = getCell(sheet, 7 + li, 1 + ai);
				}
			}
			//console.log(values);
			
			var str = handleValues(keys, '');
			//console.log(str);
			outLua += str;
			
			outLua += fileTail;
			fs.writeFile(exportFile, outLua, 'utf-8', function(error){
				if(error){
					console.log(error);
					return false;
				}
				//console.log('写入成功');
			});
		}
		else if(exportType == 'tiny') {
			console.log("exporting sheet '"+sname+"' with type " + exportType);
			
		}
	}
}

function handleDir(filePath){
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath,function(err,files){
        if(err){
            console.warn(err)
        }else{
            //遍历读取到的文件列表
            files.forEach(function(filename){
                //获取当前文件的绝对路径
                var filedir = path.join(filePath,filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir,function(eror,stats){
                    if(eror){
                        console.warn('获取文件stats失败');
                    }else{
                        var isFile = stats.isFile();//是文件
                        var isDir = stats.isDirectory();//是文件夹
                        if(isFile){
                            //console.log(filedir);
							handleFile(filedir);
                        }
                        if(isDir){
                            handleDir(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                })
            });
        }
    });
}
handleDir("excel");