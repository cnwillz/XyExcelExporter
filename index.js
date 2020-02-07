var XLSX = require('xlsx');
var fs = require('fs');
var path = require('path');

console.log("Xy导表脚本 XyExcelExporter");
console.log("作者: willz[qq3243309346]");

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
	console.log("handle file: "+ filePath + " with " + workbook.SheetNames.length + " sheets");
	for(var s = 0; s < workbook.SheetNames.length; s++) {
		var sname = workbook.SheetNames[s];
	 
		var sheet = workbook.Sheets[sname];
	
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
			
			outLua += fileTail;
			fs.writeFile(exportFile, outLua, 'utf-8', function(error){
				if(error){
					console.log(error);
					return false;
				}
				//console.log('写入成功');
			})

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