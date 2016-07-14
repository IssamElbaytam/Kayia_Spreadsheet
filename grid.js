function Grid(query, gridElement, top, left, height, width, gridOptions) {		

	// Load positioning
	if (top == null)  this.top  = function() { return gridElement.offsetTop; };  else this.top = top; 
	if (left == null) this.left = function() { return gridElement.offsetLeft; }; else this.left = left; 
	if (height == null) this.height = function() { return window.innerHeight - this.top(); }; else this.height = height;
	this.width = width;

	// Load Grid Options with defaults
	if (gridOptions.selectionLocation === undefined) this.selectionLocation = {}; 	else this.selectionLocation = gridOptions.selectionLocation;
	if (gridOptions.showQueryRibbon === undefined) 	this.showQueryRibbon = false; 	else this.showQueryRibbon = gridOptions.showQueryRibbon;
	if (gridOptions.blueDot === undefined) 			this.blueDot = true; 			else this.blueDot = gridOptions.showBlueDot;				// Show blue dot in bottom right?
	if (gridOptions.showColHeader === undefined) 	this.showColHeader = true; 		else this.showColHeader = gridOptions.showColHeader;
	if (gridOptions.showRowHeader === undefined) 	this.showRowHeader = true; 		else this.showRowHeader = gridOptions.showRowHeader;
	if (gridOptions.showVScrollbar === undefined) 	this.showVScrollbar = true; 	else this.showVScrollbar = gridOptions.showVScrollbar;
	if (gridOptions.showHScrollbar === undefined) 	this.showHScrollbar = true; 	else this.showHScrollbar = gridOptions.showHScrollbar;
	if (gridOptions.colWidths === undefined)  		this.colWidths = {};  			else this.colWidths  = gridOptions.colWidths;  				// e.g. {"3":120, "6":50};
	if (gridOptions.rowHeights === undefined) 		this.rowHeights = {}; 			else this.rowHeights = gridOptions.rowHeights; 				// e.g. {"4":27, "8":15};
	if (gridOptions.data === undefined) 				this.data = {}; 			else this.data = gridOptions.data; 	   						// e.g. {"A'1": "HELLO A1", "B'2": "HI B2!", "C'3":"9"};
	if (gridOptions.project === undefined) 			this.project = ""; 		else this.project = gridOptions.project;					// A unique project code, e.g. za4wF7
	if (gridOptions.propertyBox === undefined) 	this.propertyBox = false; 			else this.propertyBox = gridOptions.propertyBox;		// Show selection on grid?
	if (gridOptions.col_override === undefined) this.col_override = {}; 			else this.col_override = gridOptions.col_override;
	if (gridOptions.row_override === undefined) 	this.row_override = {}; 		else this.row_override = gridOptions.row_override;
	
	this.tables = {};
	this.selection = {};
	this.rowIndexes = {};
	this.rowIDs = {};

	this.lastRow = 0;
	this.gridElement = gridElement;
	
	this.rangeBox = 48;
	this.functionSliderPosition = 84;
	this.functionSliderLimit = { "min" : 50, "max" : 600 };

	// Initialize Scrollbars
	this.initializeScrollbars();

	this.colBeingResized = -1;
	this.rowBeingResized = -1;
	this.inSelection = false;
	this.inEdit = false;
	this.editingCell = false;
	this.editingQuery = false;
	this.residualMouseUp = false;

	this.QUERY_BAR_HEIGHT = 0;
	if (this.showQueryRibbon) this.QUERY_BAR_HEIGHT = 30;
	this.gridTop = 0;
	this.loadEvents(gridElement);

	if (gridElement.getContext) {
		this.context = gridElement.getContext("2d");
		if (document.getElementById("header") != null) drawHeader(false, true);
		if (location.hash.length > 1) runQuery();
		this.context.canvas.width  = this.width();
		this.context.canvas.height = this.height();
		if (this.propertyBox) { this.selection.col = 1; this.selection.row = 1; }
		this.drawFullSheet();
	}
}

Grid.prototype.ColWidth = function(index) 
{
	var DEFAULT_COL_WIDTH = 70;
	var HEADER_WIDTH = 40;
	var HEADER_WIDTH_STUB = 6;
	if (index == 0) { if (this.showRowHeader) return HEADER_WIDTH; else return HEADER_WIDTH_STUB; }
	if (this.colWidths[index] > 0) return this.colWidths[index];
	return DEFAULT_COL_WIDTH;
}

Grid.prototype.RowHeight = function(index) 
{
	var DEFAULT_ROW_HEIGHT = 21;
	var HEADER_HEIGHT = 23;
	var HEADER_HEIGHT_STUB = 6;
	if (index == 0) { if (this.showColHeader) return HEADER_HEIGHT; else return HEADER_HEIGHT_STUB; }
	if (this.rowHeights[index] > 0) return this.rowHeights[index];
	return DEFAULT_ROW_HEIGHT;
}

Grid.prototype.resizeCol = function(x) 
{
	var q = this.placeColumn(this.colBeingResized) + this.ColWidth(this.colBeingResized);
	this.colWidths[this.colBeingResized] = this.ColWidth(this.colBeingResized) + (x - q);
	this.selection = {};
	this.resetGrid();
	this.drawFullSheet();
}

Grid.prototype.resizeRow = function(y) 
{
	var adjustedY = y - this.gridTop;
	var q = this.placeRow(this.rowBeingResized) + this.RowHeight(this.rowBeingResized);
	this.rowHeights[this.rowBeingResized] = this.RowHeight(this.rowBeingResized) + (adjustedY - q) + 20;
	this.selection = {};
	this.resetGrid();
	this.drawFullSheet();
}

Grid.prototype.canColResize = function(x, y) 
{
	return (x > (this.placeColumn(this.getSelectedColumn(x)) - 3) && x < (this.placeColumn(this.getSelectedColumn(x)) + 3) && y > this.gridTop && y < (this.gridTop + this.RowHeight(0)));
}

Grid.prototype.canRowResize = function(x, y) 
{
	var adjustedY = y - this.gridTop;
	return (adjustedY > (this.placeRow(this.getSelectedRow(y)) - 3) && adjustedY < (this.placeRow(this.getSelectedRow(y)) + 3) && x < this.ColWidth(0));
}

Grid.prototype.resetGrid = function() { // Clear the grid	
	this.gridElement.width = this.gridElement.width;
}

Grid.prototype.selectCell = function(x, y) { 
	if (this.inEdit) this.gridElement.finishEdit();
	if (!this.inSelection) {
		this.selection.col = this.getSelectedColumn(x); 
		this.selection.row = this.getSelectedRow(y); 
		this.inSelection = true;
	} 
	this.selection.endCol = this.getSelectedColumn(x);
	this.selection.endRow = this.getSelectedRow(y);
}

Grid.prototype.placeColumn = function(col) 
{
	var totalWidth = this.ColWidth(0);
	if (col > 0)
		for (var i=this.scroll.left; i < col; i++) {
			totalWidth += this.ColWidth(i);
		}
	return totalWidth;
}

Grid.prototype.placeRow = function(row) 
{
	var totalHeight = this.gridTop + this.RowHeight(0); //46
	if (row <= 0) totalHeight = 23;
	else 
		for (var i=this.scroll.top; i < row; i++) {
			totalHeight += this.RowHeight(i);
		}
	
	return totalHeight +  (this.showQueryRibbon?0:2);
}

Grid.prototype.getSelectedColumn = function(x) 
{
	var totalWidth = this.ColWidth(0);
	if (x > this.ColWidth(0)) {
		for (var i=this.scroll.left; totalWidth < (this.width() - this.SCROLLBAR_WIDTH); i++) {
			totalWidth += this.ColWidth(i);
			if (totalWidth > x) return i;
		}
	}
	return 0;
}

Grid.prototype.getSelectedRow = function(y) 
{
	var totalHeight = this.RowHeight(0) - 17;
	if (y > this.gridTop) {
		y -= this.gridTop;
		for (var i=this.scroll.top; totalHeight < this.height(); i++) {
			totalHeight += this.RowHeight(i);
			if (totalHeight > y) return i-1;
		}
	}
	return -1;
}

function adjustCols(colList) {
	var newColList = {};
	for (var c in colList) {
		if (colList[c].keyID != '~ID') newColList[colList[c].keyID] = colList[c].keyText.substr(1);
	}
	return newColList;
}

