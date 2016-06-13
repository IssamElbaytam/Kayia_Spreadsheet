// MOUSE EVENTS
Grid.prototype.loadEvents = function(grid) 
{
	grid.addEventListener('mousedown', this.mouseDown, false);		// Attach the mousedown event listener
	grid.addEventListener('mousemove', this.mouseMove, false);		// Attach the mousemove event listener
	grid.addEventListener('mouseup',   this.mouseUp, false);		// Attach the mouseup event listeners
	grid.addEventListener('dblclick', this.mouseDoubleClick, false);		// Attach the double-click mouse event listener
	grid.addEventListener('mousewheel', this.mouseWheel, false);			// Attach the double-click mouse event listener
	grid.addEventListener('DOMMouseScroll', this.mouseWheelGecko, false);	// Attach the double-click mouse event listener
}

Grid.prototype.mouseDown = function(ev) 
{
	var event = resolveEvent(ev);
	var obj = grids[this.id];
	gridInEdit = obj;
	if (obj.inEdit) obj.finishEdit();
	obj.inSelection = false;
	obj.inScroll = obj.hitScrollObject(ev._x, ev._y);
	if (obj.inScroll > 0) { 
		obj.handleScrollObject(ev._x, ev._y);
		if (obj.scrollTypesThatRepeat() && obj.scrollInterval == 0) { tmpGridObject = obj; obj.scrollInterval = window.setTimeout("repeatScroll2(" + ev._x + "," + ev._y + ")", obj.SCROLL_INITIAL_DELAY); }
	} else {
		obj.selectCell(ev._x, ev._y);
		if (obj.canColResize(ev._x, ev._y)) obj.colBeingResized = obj.getSelectedColumn(ev._x) - 1; 
		if (obj.canRowResize(ev._x, ev._y)) obj.rowBeingResized = obj.getSelectedRow(ev._y); 
		if (obj.colBeingResized < 0 && obj.rowBeingResized < 0) obj.drawFullSheet(); else obj.inSelection = false;
	}
}
Grid.prototype.mouseMove = function(ev) 
{
	var event = resolveEvent(ev);
	var obj = grids[this.id];
	if (obj.inScroll > 0) {
		if (!obj.scrollTypesThatRepeat()) obj.handleScrollObject(ev._x, ev._y);
	} else {
		if (obj.canColResize(ev._x, ev._y) || obj.colBeingResized >= 0) obj.gridElement.style.cursor = "col-resize"; 
		else { 
			if (obj.canRowResize(ev._x, ev._y) || obj.rowBeingResized >= 0) obj.gridElement.style.cursor = "row-resize"; 
			else obj.gridElement.style.cursor = "default";
		}
		if (obj.colBeingResized >= 0) obj.resizeCol(ev._x);
		if (obj.rowBeingResized >= 0) obj.resizeRow(ev._y);
		if (obj.inSelection) { obj.selectCell(ev._x, ev._y); obj.drawFullSheet();}
	}
}
Grid.prototype.mouseUp = function(ev) 
{
	var event = resolveEvent(ev);
	var obj = grids[this.id];	
	obj.colBeingResized = -1;
	obj.rowBeingResized = -1;
	obj.residualMouseUp = obj.inScroll;
	obj.inSelection = false;
	tmpGridObject = {};
	if (obj.inScroll) {
		obj.inScroll = 0;
		obj.scrollInterval = 0;
		obj.drawFullSheet();
	}
}
Grid.prototype.mouseDoubleClick = function(ev) 
{
	var event = resolveEvent(ev);
	var obj = grids[this.id];	
	if (obj.residualMouseUp == 0) {
		obj.editCell(true,'');
	}
}

Grid.prototype.mouseWheel = function(ev) { }

Grid.prototype.mouseWheelGecko = function(ev) { }

// KEYBOARD EVENTS
function query_keypress(ev) {
	if (resolveKeyEvent(ev) == 13) { runQuery($(this).val());  maingrid.focus(); }
}
function query_focus(ev) {
	gridInEdit = null;		// When editing the query bar, no grid is in edit (keystrokes go to the query input box)
}

