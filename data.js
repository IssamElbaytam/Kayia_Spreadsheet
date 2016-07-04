function displayResult(data) { grids.maingrid.loadDataToGridElement(data[0]); }

function runQuery(cmd) {

	$.ajax({
		type: 'GET',
		url: "https://kayia.org/" + cmd,
		async: true,
		contentType: 'application/json',
		dataType: 'jsonp',
		success: function(data) {
			alert(data);
			//if (data) func(data, cmdID);
		},
		error: function(e) { console.log('error:' + e.statusText); }
	});
}
Grid.prototype.renderData = function() // For all the this.data in the this.data objects, renders it as text
{
	for (key in this.data) {
		if (this.data.hasOwnProperty(key)) {
			var attr = {};
			var addr = splitAddress(key);
			if ((addr[0] - this.scroll.left) >= 0 && (addr[1]  - this.scroll.top) >= 0) {
                                var left = this.placeColumn(addr[0]);
                                var top =  this.placeRow(addr[1]);
				var x_pos = left + 5;
				var y_pos = top + (this.RowHeight((addr[1] - this.scroll.top + 1))/1.3);

				if (isNumeric(this.data[key])) attr.align = "right"; else attr.align = "left"; 
				if (attr.align == "right") x_pos = left + this.ColWidth(addr[0] - this.scroll.left - 1) - 3;
			
				SetTextStyle(this.context, attr); 	// Text header
				//this.context.fillText('HELLO', x_pos, y_pos);
				this.context.fillText(evaluated(deobjected(this.data[key])), x_pos, y_pos);
			}
		}
	}
}

Grid.prototype.editCell = function(highlight, startChar) 
{
	if (this.selection.col == this.selection.endCol && this.selection.row == this.selection.endRow) {
		var left = this.placeColumn(this.selection.col);
		var top =  this.placeRow(this.selection.row);
		ieditor.style["background-color"] = (this.selection.row <= 0) ? "#c3d3e5" : "#f5faff";
		ieditor.style.left = left + this.left() + 4 + "px"; // + padding
		ieditor.style.top = top + this.top() + 4 + "px"; // + padding for logo/queryBar
		alert(this.ColWidth(this.selection.col) + 'px');
		ieditor.style.width = this.ColWidth(this.selection.col) + 'px';
		//ieditor.style.height = "17px";	TODO: Adjust to height
		ieditor.style.display = "block";		
		
		if (!this.inEdit) ieditor.innerHTML = "";
		if (this.data[columnCode(this.selection.col-1) + "'" + this.selection.row] != undefined)
			ieditor.innerHTML = this.data[columnCode(this.selection.col-1) + "'" + this.selection.row];
		//ieditor.innerHTML += startChar;
		//var r = window.getSelection().getRangeAt(0); 
		//if (startChar != '') { r.setStart(ieditor,1); r.setEnd(ieditor,1); r.START_TO_START = 1; } 
		this.inEdit = true;
		ieditor.focus();	
	}
}

Grid.prototype.finishEdit = function() 
{
	if (this.inEdit) {
		var value = cleanBR(ieditor.innerHTML);
		if (this.selection.row <= 0) {
			this.col_override[columnCode(this.selection.col-1)] = value;
		} else {
			var cartesian = columnCode(this.selection.col-1) + "'" + this.selection.row;
			var predicate = document.getElementById('query').value;
			if (this.gridElement.id == 'kidgrid') predicate += '.' + columnCode(grids.maingrid.selection.col-1) + "'" + grids.maingrid.selection.row;
			this.data[cartesian] = value;
			//$.getJSON("http://127.0.0.1:8448/test?" + predicate + '.' + cartesian + ':=' + (encodeURIComponent(isNumber(value)?value:'"' + value + '"')), function() {});
		}
		ieditor.style.display = "none";
		ieditor.innerHTML = '';
		this.resetGrid();
		this.drawFullSheet();
	}
	this.inEdit = false;
}

function tableExists(tableName) {
	if (Object.keys(this.tables).length === 0) { 
		$.getJSON("http://this.data.kayadb.com/?callback=?&q=*.*", function(qData) { loadTables(qdata); }); 
	}
	return this.tables[tableName];
}

function loadTables(result) {
	var tbls = result["#Structure"]["#this.columns"];
	for (var t in tbls) {
		this.tables[tbls[t].keyText.substr(1)] = tbls[t].keyID;
	}
}

Grid.prototype.loadDataToGridElement = function(result) 
{
	if (result !== null) { 
		this.loadDataObject(result);
		this.renderData();
	}
}

Grid.prototype.loadDataObject = function(result) 
{
	if (typeof result != 'object')  { this.data["A'1"] = result; return; } // If data is scalar, place in A'1
	var columnList = result["32"];
	this.data = {};
	var rows = {};  
	rows = result["33"];
	var realrows = []
	delete rows['clone'];
	for (var row in rows) {								// go through each row of the data
		if (rows.hasOwnProperty(row)) {
			realrows.push(row);
		}
	}
	for (var i=0; i<realrows.length;i++) {
		var rowNumber = rows[realrows[i]].label;
		var realcols = [];
		for (var col in rows[realrows[i]]) {
			realcols.push(col);
		}
		for (var j=0; j<realcols.length;j++) {
			var col = realcols[j];
			if (col != 'label' && col != 'clone') {	//TODO: get rid of toUpperCase()
				this.data[columnList[col].label.toUpperCase() + rowNumber] = rows[realrows[i]][col];
			}
		}
	}
}

function resolveEvent(ev) {
	if (ev.layerX || ev.layerX == 0) { // Firefox
		ev._x = ev.layerX;
		ev._y = ev.layerY;
	} else if (ev.offsetX || ev.offsetX == 0) { // Opera
		ev._x = ev.offsetX;
		ev._y = ev.offsetY;
	}				
	return ev;
}

function evaluated(expr) {
	if ((''+expr).substr(0,1) == "=") { // if an expression
		expr = expr.substr(1);
		var matches = expr.match(/[A-Z]+[0-9]+/g);
		for (i=0; i<matches.length; i++) {
			var match = matches[i];
			expr = expr.substr(0,expr.indexOf(match)) + geDataPoint(match) + expr.substr(expr.indexOf(match)+ match.length);
		}
		expr = eval(expr);
	}
	return dequote(expr);
}
function geDataPoint(addr) {
	if (this.data[addr]) {
		if (isNumeric(this.data[addr])) return this.data[addr]; else return '"' + this.data[addr] + '"';
	}
	return "";
}

function checkLogin() {
	if (!sessionStorage['ID']) {
		$('#li_logout').html('');
		$('#li_uid').show(); $('#li_pwd').show(); $('#li_login').show();
	} else {
		$('#li_logout').html('<div style="color:white;">Hello, ' + sessionStorage['User'] + '   <a href="#" id="logout" style="margin-top:9px;margin-left:20px;">Logout</a></div>');
		$('#li_uid').hide(); $('#li_pwd').hide(); $('#li_login').hide();
	}
}

function createSession(data) { if (data && data.Session) { sessionStorage['ID']= data.Session; sessionStorage["User"] = data.User; checkLogin(); } }
function useSession(s) { return (s ? s + '/' : ''); }
function ajaxCall(url, func, cmdID) {
	$.ajax({
		type: 'GET',
		url: 'https://kayia.org/' + url,
		async: true,
		contentType: 'application/json',
		dataType: 'jsonp',
		success: function(data) { if (data) func(data, cmdID); }, 
		error: function(e) { console.log('error:' + e.statusText); }
	});
}
function query(cmd, func, sessionID, commandID) {
	var url = useSession(sessionID);
	if (cmd.length == 0 && commandID) url += encodeURIComponent(commandID);
	else {
		var commandID = getCommandID();
		sessionStorage[commandID] = cmd;
		url += encodeURIComponent(commandID) + '/' + encodeURIComponent(cmd);
	}
	ajaxCall(url, func, commandID);
}

function deref(col, val) {
  return val;
	if (!val || val === undefined) return '';
	if ($.isArray(val)) { var result = []; for (var i=0; i < val.length; i++) result.push(deref(col, val[i])); return result.join(', '); }
	if ((''+val).substr(0,1) != '#')  return '<a href="#' + poseQuery(col + '="' + val + '"') + '">' + val + '</a>';
	query(encodeURIComponent(val), labeler);
	return '<a class="'+val.substr(1)+'" href="#' + poseQuery(col + '=' + val) + '">' + val + '</a>';
	//return val;
}

function labeler(data, cmd) {
	var text = ''+data.Name?data.Name:''+data.Title?data.Title:'';
	$('.'+cmd).html(text);
}
function render(data, cmd) {
	var columns = {};
	for (var row in data) for (var col in data[row]) if (!columns[col]) columns[col] = '';
	loadDataGrid(columns, data);
}
function toggle(a, b, c) { if ($(a).hasClass(c)) $(a).removeClass(c); if (!$(b).hasClass(c)) $(b).addClass(c); }

$('#btn-text').click(function() {
	toggle("#result-text", "#result-grid", "hidden");
	toggle("#btn-grid", "#btn-text", "active");
});
$('#btn-grid').click(function() {
	toggle("#result-grid", "#result-text", "hidden");
	toggle("#btn-text", "#btn-grid", "active");
});

function getCommandID() { var ID = guid(); if (sessionStorage[ID]) return getNewID(); return ID; }

function guid(){
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
	var r = (d + Math.random()*16)%16 | 0;
	d = Math.floor(d/16);
	return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
};