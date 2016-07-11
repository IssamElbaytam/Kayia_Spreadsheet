// Palettes
var HIGH_BLUE = "#e7effb";
var LIGHT_BLUE = "#d1d8e6";
var NEAR_BLUE = "#dae1ef";
var GLOW_BLUE = "#b6c7db";
var DARK_BLUE = "#c1c8d6";
var HIGHLIGHT = "#9eb6ce";
var DEEP_BLUE = "#5e768e";
var OFF_WHITE = "#f5faff"; 
var CROSS_BLUE = "#008ccc";
var CORDON_BLUE = "#f3f5ff";
var OCEAN_BLUE = "#00aeee";
var COTE_AZUR = "#def";
var GRAY_A = "#aaa";
var GRAY_9 = "#999";
var GRAY_4 = "#444";

var tmpGridObject;

function columnCode2(colNumber, override) {	// Given 65 returns AB
	var result = columnCode(colNumber);
	if (override[result]) return override[result];
	return result;
}

function columnCode(colNumber)
  {
	var dividend = colNumber;
	var columnName = '';
	var modulo;
	var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	
	while (dividend > 0)
	{
		modulo = Math.floor((dividend - 1) % 26);
		columnName = letters[modulo] + columnName;
		dividend = Math.floor((dividend - modulo) / 26);
	} 
	return columnName;
}

function reverseColumnCode2(reversedCode, override){
	for(var i=1; i < override.length; i++){
		if(override[columnCode(i)] == reversedCode){
			return i;
		}
	}
	return reverseColumnCode(reversedCode);
}

function reverseColumnCode(reversedCode) {	// Given AB returns 28
	var result = 0;
	for (var i=reversedCode.length-1; i>=0; i--) {
		result = result + (reversedCode.charCodeAt(i)-64)* Math.pow(26,(reversedCode.length-(i+1)));
	}
	return result;
}

function splitAddress(addr) {		// Takes "some column name'34" and returns [the column # of some column name, 34]
	var result = ["", ""];
	var resultIndex = 0;
	for (var i=0; i < addr.length; i++) {
		if ((addr.charAt(i) == "'" || addr.charAt(i) == ",") && resultIndex == 0) resultIndex++;
		else result[resultIndex] += addr.charAt(i);
	}
	result[0] = reverseColumnCode2(result[0],this.grids.maingrid.col_override); // Convert column name to column number
	return result;
}

function Asc(str) { return str.charCodeAt(0); }
function Chr(asciiCode) { return String.fromCharCode(asciiCode); }

function isNumeric(input) { if (isNaN(input)) return (input - 0) == input && input.length > 0; else return true; }
function dequote(str) { if (!isNumeric(str) && str.substr(0,1) == '"' && str.substr(str.length-1) == '"') return str.substr(1,str.length-2); return str; }

function resolveKeyEvent(ev) {
	if (ev) {
		if (ev.keyCode !== null && ev.keyCode && ev.keyCode !== 0) return ev.keyCode;    // IE
		return ev.which;	  // All others
	}
}
function keypress(ev) {
	if (ev && gridInEdit && !gridInEdit.editingQuery) {
		var key = resolveKeyEvent(ev);		//String.fromCharCode()
		if (key == 13) { if (gridInEdit.inEdit) gridInEdit.finishEdit(); return; }
		if (gridInEdit.inEdit) return;
		if (key == 37) { if (gridInEdit.selection.col > 1) gridInEdit.selection.col -= 1; }		// Left arrow
		if (key == 38) { if (gridInEdit.selection.row > 1) gridInEdit.selection.row -= 1; }		// Up arrow
		if (key == 39) { gridInEdit.selection.col += 1; }		// Right arrow
		if (key == 40) { gridInEdit.selection.row += 1; }		// Down arrow
		if (key == 46) { gridInEdit.data[columnCode(gridInEdit.selection.col) + "'" + gridInEdit.selection.row] = ""; }		// Delete key
		if ((key >= 37 && key <= 40) || key == 46) { 
			gridInEdit.selection.endCol = gridInEdit.selection.col; 
			gridInEdit.selection.endRow = gridInEdit.selection.row;
			gridInEdit.drawFullSheet(); 
		} else gridInEdit.editCell(true, String.fromCharCode(key));
	}
}

function SetTextStyle(context, attr) { // Set Text font, color and alignment
	context.font = getAttrWithDefault(attr, "font");
	context.textAlign = getAttrWithDefault(attr, "align");
	context.fillStyle = getAttrWithDefault(attr, "color");
}

function getAttrWithDefault(attr, selection) {
	if (attr) {
		if (selection == "font") if (attr.font) return attr.font; else return "12px sans-serif"; 
		if (selection == "align") if (attr.align) return attr.align; else return "center"; 
		if (selection == "color") if (attr.color) return attr.color; else return "black"; 
	}
}

function mouseWheel() { }
function mouseWheelGecko() { }

function cleanBR(val) {
	for (var i=val.length; i>0;i-=4) {
		if (val.substr(val.length-4,4) == '<br>') val = val.substr(0, val.length-4); else break;
	}
	return val;
}

function getClientSize(context) {
	if( typeof(window.innerWidth) == 'number' ) {   
		context.canvas.width = window.innerWidth - 4;
		context.canvas.height = window.innerHeight - 4;
	} else if( document.documentElement && ( document.documentElement.context.canvas.width || document.documentElement.context.canvas.height ) ) { 	//IE 6+ in 'standards compliant mode'
		context.canvas.width = document.documentElement.context.canvas.width;
		context.canvas.height = document.documentElement.context.canvas.height;
	} else if( document.body && ( document.body.context.canvas.width || document.body.context.canvas.height ) ) { //IE 4 compatible
		context.canvas.width = document.body.context.canvas.width;
		context.canvas.height = document.body.context.canvas.height;
	}
}

function selectionAbsCol(sel) 		{ return Math.min(sel.col, sel.endCol); }
function selectionAbsEndCol(sel) 	{ return Math.max(sel.col, sel.endCol); }
function selectionAbsRow(sel) 		{ return Math.min(sel.row, sel.endRow); }
function selectionAbsEndRow(sel) 	{ return Math.max(sel.row, sel.endRow); }

function runQuery2() {
/*
	if (tableExists($("#query").val())) {
		$.getJSON("http://data.kayadb.com/?callback=?&q=" + encodeURIComponent($("#query").val()), function(qData) { loadthis.dataTogridElement(qData); });
	} else {	
		$.getJSON("http://data.kayadb.com/?callback=?&q=" + encodeURIComponent('* += ' + $("#query").val()), function() {});		
	}
	location.hash = encodeURIComponent($("#query").val());
*/
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function around(pivot, compare, margin) {
	return (compare >= (pivot - margin) && compare <= (pivot + margin));
}

function deobjected(value) {
	if (typeof value == 'object') {
		for (var key in value) { if (value.hasOwnProperty(key)) return value[key];	}
	} else return value;
}

Object.prototype.clone = function() {
/*  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;*/
};
