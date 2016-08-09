
function runQuery(cmd) {

//	if (cmd == 'Film') grids.maingrid.loadDataToGridElement(JSON.parse('{"#ragingbull":{"Title":"Raging Bull","Director":"#mscorsese","Released":"1975"},"#delicatessen":{"Title":"Delicatessen","Director":["#jpjeunet","#mcaro"],"Released":"1991"},"#bluevelvet":{"Title":"Blue Velvet","Director":"#dlynch","Released":"1986"}}'))
	
	//  This can be removed when placed on the site, or use http:// instead of https://
        $.ajax({
                type: 'GET',
                url: "https://kayia.org/" + cmd,
                async: true,
                contentType: 'application/json',
                dataType: 'jsonp',
                success: function(data) {
                        grids.maingrid.loadDataToGridElement(data);
                        //alert(data);
                        //if (data) func(data, cmdID);
                },
                error: function(e) {
                        console.log('error:' + e.statusText);
                }
        });
	//
}
function flip(coll) { 
	var result = {};
	for (var obj in coll) {
		if (coll.hasOwnProperty(obj)) { result[coll[obj]] = obj; }
	}
	return result;
}

Grid.prototype.getNextColOverrideIndex = function() {
	for (var i = 1; i < Object.keys(this.col_override).length+1; i++) {
		if (!this.col_override[columnCode(i)]) break;
	}
	return columnCode(i);
}

Grid.prototype.getNextRowOverrideIndex = function() {
	for (var i = 1; i <= Object.keys(this.row_override).length+1; i++) {
		if (!this.row_override[''+i]) break;
	}
	return i;
}

Grid.prototype.loadDataObject = function(data) 
{
	if (typeof data != 'object')  { 
		this.data["A'1"] = data; return; // If data is scalar, place in A'1
	}
	this.row_override = [];
	this.col_override = [];
	this.data = {};
	
	for (var rowID in data) {								// go through each row of the data
		if (data.hasOwnProperty(rowID)) { 
			this.row_override[this.getNextRowOverrideIndex()] = rowID;
			for (var column in data[rowID]) {	
				if (data[rowID].hasOwnProperty(column)) { 
					var colLetter = flip(this.col_override)[column];
					if (!colLetter) {
						colLetter = this.getNextColOverrideIndex();
						this.col_override[colLetter] = column;
					}
					this.data[colLetter + "'" + flip(this.row_override)[rowID]] = data[rowID][column];
				}
			}
		}
	}
	this.drawFullSheet();
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
				var x_pos = this.placeColumnData(addr[0]);
				var row_height = this.RowHeight(addr[1]);
				var col_width = this.ColWidth(addr[0]);
				var y_pos = this.placeRowData(addr[1]);
				if (isNumeric(this.data[key])) attr.align = "right"; else attr.align = "left"; 
				if (attr.align == "right") x_pos = left + col_width - 3;
				this.context.save();
				this.context.beginPath();
				SetTextStyle(this.context, attr); 	// Text header
				this.context.rect(left, top, col_width, row_height);
				this.context.clip()
				this.context.fillText(evaluated(deobjected(this.data[key])), x_pos, y_pos);
				this.context.restore();
			}
		}
	}
}

Grid.prototype.editCell = function(highlight, startChar) 
{	
//	if(this.inEdit == true){
//		this.finishEdit();
//	}
	if (this.selection.col == this.selection.endCol && this.selection.row == this.selection.endRow) {
		var left = this.placeColumnData(this.selection.col)+this.left();
		var top =  this.placeRowData(this.selection.row)+this.top();
		ieditor.style["background-color"] = (this.selection.row <= 0) ? "#c3d3e5" : "#f5faff";
		ieditor.style.left = left + "px"; 
		ieditor.style.top = top - 11 + "px"; // TODO the magic '11' is of unknown origin
		ieditor.style.height = this.RowHeight(this.selection.row) - 6 + "px"; // TODO the magic '6' is of unknown origin
		ieditor.style.width = this.ColWidth(this.selection.col) - 6 +"px"; // TODO the magic '6' is of unknown origin
		ieditor.style.display = "block";		
		
		if (!this.inEdit) ieditor.innerHTML = "";
		if(this.selection.row){
			if (this.data[columnCode(this.selection.col) + "'" + this.selection.row] != undefined){
				ieditor.innerHTML = this.data[columnCode(this.selection.col) + "'" + this.selection.row];
			}
		} else {
			ieditor.innerHTML = this.col_override[columnCode(this.selection.col)] || ieditor.innerHTML;
		}
		this.inEdit = true;
		ieditor.focus();	
	}
}

Grid.prototype.finishEdit = function() 
{
	if (this.inEdit) {
		var value = cleanBR(ieditor.innerHTML);
		if (this.selection.row <= 0) {
			this.col_override[columnCode(this.selection.col)] = value;
		} else {
			var cartesian = columnCode(this.selection.col) + "'" + this.selection.row;
			this.data[cartesian] = value;
			var predicate = document.getElementById('query').value;
			if (this.gridElement.id == 'kidgrid') predicate += '.' + columnCode(grids.maingrid.selection.col) + "'" + grids.maingrid.selection.row;
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
