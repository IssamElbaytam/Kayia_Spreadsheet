
Grid.prototype.drawGrid = function() 
{
	if (this.showQueryRibbon) this.gridTop = this.RowHeight(0);
	//if (!this.showColHeader) this.gridTop -= this.RowHeight(0);

	this.context.lineWidth = 1;

	this.context.fillStyle = this.colHeaderGradient("white", HIGH_BLUE, LIGHT_BLUE); 	// Headers  if (this.showColHeader) 
	this.context.fillRect(0, this.gridTop, this.width() - this.SCROLLBAR_WIDTH, this.RowHeight(0)+2);		// Column Header

	this.context.fillStyle = NEAR_BLUE;
	this.context.fillRect(0,  this.RowHeight(0) + this.QUERY_BAR_HEIGHT - (this.showQueryRibbon?7:0), this.ColWidth(0), this.height() - this.SCROLLBAR_WIDTH + this.RowHeight(0));		// Row Header  if (this.showRowHeader) 

	this.drawColumns();						// Draw columns
	this.drawRows();							// Draw rows
	
	if (this.showQueryRibbon) this.drawFunctionSlider("#");		// Function image
	this.context.strokeStyle = DARK_BLUE; this.context.strokeRect(0, this.gridTop, this.width() - this.SCROLLBAR_WIDTH, this.RowHeight(0) + 1);		// Line under Query Bar
	this.context.fillStyle = "white"; this.context.fillRect(0, this.RowHeight(0) + this.QUERY_BAR_HEIGHT + 2 - (this.showQueryRibbon?7:0), this.ColWidth(0), 1);	// Top white line on rows
}

Grid.prototype.drawFullSheet = function() 
{
	var left = this.placeColumn(selectionAbsCol(this.selection));
	var top =  this.placeRow(selectionAbsRow(this.selection)) ;		
	var width = this.placeColumn(selectionAbsEndCol(this.selection)) - this.placeColumn(selectionAbsCol(this.selection)) + this.ColWidth(selectionAbsEndCol(this.selection));
	var height = this.placeRow(selectionAbsEndRow(this.selection)) - this.placeRow(selectionAbsRow(this.selection)) + this.RowHeight(selectionAbsEndRow(this.selection));

	this.resetGrid();
	this.drawGrid();
	this.setRangeBox();

	// Draw selection
	if ((selectionAbsEndRow(this.selection) == 0 || selectionAbsEndRow(this.selection) >= this.scroll.top) && (selectionAbsEndCol(this.selection) == 0 || selectionAbsEndCol(this.selection) >= this.scroll.left) && !(selectionAbsEndCol(this.selection) == 0 && selectionAbsEndRow(this.selection) == 0)) {
		this.drawRangeFill(left, top, width, height);
		if (!this.propertyBox) this.drawBlackOutline(left, top, width, height);
		if (!this.propertyBox) this.drawSmartBox(left, top, width, height);
	}

	this.renderData();
	this.drawScrollbars();

	// Set project indicator
	if (this.project != "") {
		SetTextStyle(this.context, {"align":"center"});
		this.context.fillText(this.project, 38, 18);
	}
}

Grid.prototype.drawRangeFill = function(left, top, width, height) 
{
	if (this.selection.row >= 0 && this.selection.col >= 0) {
		this.context.fillStyle = OFF_WHITE; 
		if (this.propertyBox) { 
			this.context.fillStyle = CORDON_BLUE; 
			this.context.fillRect(left+2, this.RowHeight(0) + this.gridTop+2, width-2, this.height() - this.SCROLLBAR_WIDTH - this.H_SCROLLBAR_OFFSET-2);
			this.context.fillStyle = "#fbfbfb"; 
		}
		if (this.selection.row == 0) { top = this.RowHeight(0) + this.gridTop; height = this.height() - this.SCROLLBAR_WIDTH - this.H_SCROLLBAR_OFFSET; }
		if (this.selection.col == 0) { left = this.ColWidth(0); width = this.width() - this.SCROLLBAR_WIDTH; }
		this.context.fillRect(left+2, top+2, width-3, height-3);
		this.drawRangeFillLines(left, top, width, height);
	}
}


Grid.prototype.drawRangeFillLines = function(left, top, width, height) 
{
	this.context.fillStyle = NEAR_BLUE;
	var start, end;
	
	start = this.selection.col; end = this.selection.endCol; 
	if (start > end && start > 0) { var tmp = start; start = end; end = tmp; }
	for (var c=start+1; (start > 0 && c <= end) || (start==0 && this.placeColumn(c) < this.width()); c++) {
		this.context.fillRect(this.placeColumn(c), top, 1, height);
	}

	start = this.selection.row; end = this.selection.endRow; 
	if (start > end && start > 0) { var tmp = start; start = end; end = tmp; }
	if (height < 0) top = top + height; 
	var rowHeightTotal = top;
	for (var r=start; (start > 0 && r < end) || (start==0 && rowHeightTotal < this.height()); r++) {
		this.context.fillRect(left, rowHeightTotal + this.RowHeight(r), width, 1);
		rowHeightTotal += this.RowHeight(r);
	}
}

Grid.prototype.drawBlackOutline = function(left, top, width, height) 
{
	this.context.strokeStyle = "black";
	this.context.lineWidth = 2;
	left++; top++;
	if (this.selection.col > 0 && this.selection.row > 0) { 
		this.context.strokeRect(left, top, width, height);
	}
	if (this.selection.col == 0 && this.selection.row > 0) { 
		this.context.strokeRect(left, top, this.width(), 0);
		this.context.strokeRect(left, top + height, this.width(), 0);
	}
	if (this.selection.col > 0 && this.selection.row == 0) { 
		this.context.strokeRect(left, top, 0, this.height());
		this.context.strokeRect(left + width, top, 0, this.height());
	}
	if (this.selection.col == 0 && this.selection.row == 0) { 
		this.context.strokeRect(left, top, 0, this.height());
		this.context.strokeRect(left, top, this.width(), 0);
	}
}

Grid.prototype.drawSmartBox = function(left, top, width, height) 
{
	var x = left + width + 1;  
	var y = top + height + 1;  

	if (this.selection.col > 0 && this.selection.row > 0) { 
		this.context.fillStyle = "white";
		this.context.fillRect(x-3, y-3, 5, 5);
		this.context.fillStyle = "black";
		this.context.fillRect(x-2, y-2, 4, 4);
	}
}


Grid.prototype.drawColumns = function() 
{
	var colWidthTotal = 0;
	var isSelected = false;
	
	// Left Line of A'1
	this.context.fillStyle = HIGHLIGHT;  this.context.fillRect(this.ColWidth(0), this.gridTop+1, 1, this.RowHeight(0));
	this.context.fillStyle = LIGHT_BLUE; this.context.fillRect(this.ColWidth(0), this.RowHeight(0) + this.gridTop, 1, this.height() - this.H_SCROLLBAR_OFFSET);

	for (var c = this.scroll.left; colWidthTotal <= (this.width()); c++) {
		this.context.fillStyle = HIGHLIGHT;
		if (this.selection != undefined) {
			if ((this.selection.endCol === undefined && c == this.selection.col) || (this.selection.endCol && (c >= this.selection.col && c <= this.selection.endCol) || (this.selection.col > this.selection.endCol && c <= this.selection.col && c >= this.selection.endCol))) {
				isSelected = true;
				this.context.fillStyle = this.colHeaderGradient(HIGH_BLUE, NEAR_BLUE, HIGHLIGHT);		// Headers
				this.context.fillRect(colWidthTotal + this.ColWidth(0), this.gridTop, this.ColWidth(c), this.RowHeight(0)+1);		// Column Header
				this.context.fillStyle = DEEP_BLUE;
				this.context.fillRect(colWidthTotal + this.ColWidth(0), this.gridTop+1, 1, this.RowHeight(0)+1);
				this.context.fillStyle = HIGHLIGHT;
			}
		}
		this.context.fillRect(colWidthTotal + this.ColWidth(c) + this.ColWidth(0), this.gridTop, 1, this.RowHeight(0)+2);
		this.context.fillStyle = LIGHT_BLUE;
		this.context.fillRect(colWidthTotal + this.ColWidth(c) + this.ColWidth(0), this.RowHeight(0) + this.gridTop+2, 1, this.height() - this.H_SCROLLBAR_OFFSET);

		if (isSelected) {
			this.context.fillStyle = DEEP_BLUE;
			this.context.fillRect(colWidthTotal + this.ColWidth(0) + this.ColWidth(c), this.gridTop+1, 1, this.RowHeight(0)+1);		
		}
		
		SetTextStyle(this.context, {}); 	// Text header
		if (this.showColHeader) this.context.fillText(columnCode2(c-1, this.col_override), colWidthTotal  + this.ColWidth(0) + (this.ColWidth(c)/2), this.gridTop + this.RowHeight(0) - 6);  
		colWidthTotal += this.ColWidth(c);
		isSelected = false;
	}
}

Grid.prototype.drawRows = function() 
{
	var x = false;
	var rowHeightTotal = this.gridTop + 1;
	
	for (var r = this.scroll.top; rowHeightTotal < (this.height() - this.H_SCROLLBAR_OFFSET); r++) {
		this.context.fillStyle = LIGHT_BLUE;
		this.context.fillRect(0, rowHeightTotal + this.RowHeight(0), this.width() - this.SCROLLBAR_WIDTH, 1);

		this.context.fillStyle = "white";
		if (x) { this.context.fillStyle = DEEP_BLUE; x=false; } // Shit.
		if (this.selection != undefined) {
			if ((this.selection.endRow === undefined && r == this.selection.row) || (this.selection.endRow && (r >= this.selection.row && r <= this.selection.endRow) || (this.selection.row > this.selection.endRow && r <= this.selection.row && r >= this.selection.endRow))) {
				this.context.fillStyle = GLOW_BLUE;
				this.context.fillRect(0, rowHeightTotal + this.RowHeight(0) + 1, this.ColWidth(0), this.RowHeight(r));
				this.context.fillStyle = DEEP_BLUE;
				x = true;
			} 
		}
		this.context.fillRect(0, rowHeightTotal + this.RowHeight(r) + 2, this.ColWidth(0), 1);	// if (this.showRowHeader) 

		SetTextStyle(this.context, {}); 	// Text header
		if (this.showRowHeader) this.context.fillText(r, this.ColWidth(0)/2, rowHeightTotal + this.RowHeight(0) + this.RowHeight(r) - (this.RowHeight(r)*.28) + (this.showQueryRibbon?1:0));
		rowHeightTotal += this.RowHeight(r);
	}
}
Grid.prototype.drawFunctionSlider = function(label) 
{
	var y = 0;
	var x = this.functionSliderPosition;
	
	if (x < this.functionSliderLimit.min) x = this.functionSliderLimit.min;
	if (x > (this.width() - this.functionSliderLimit.max)) x = this.width() - this.functionSliderLimit.max;

	selCtrl.style.width = (x - 18) + "px";
	queryCtrl.style.left = x + 55 + "px";
	queryCtrl.style.width = 734 - x + "px";
	this.rangeBox = x;

	var grad3 = this.context.createLinearGradient(0, 0, 0, 40);
	grad3.addColorStop(0, HIGH_BLUE); grad3.addColorStop(1, DARK_BLUE);
	this.context.fillStyle = grad3;
	this.context.lineWidth = 1;
	this.context.beginPath();
	this.context.arc(x+6, y+12, 12, 0, Math.PI*2, true);
	this.context.closePath();
	this.context.fill();
	
	this.context.shadowOffsetX = 2;
	this.context.shadowOffsetY = 0;
	this.context.shadowBlur    = 2;
	this.context.shadowColor   = GRAY_9;
	this.context.fillRect(x, y, 50, 24);
	
	this.context.shadowOffsetX = 1;
	this.context.shadowOffsetY = 1;
	this.context.shadowBlur    = 1;
	this.context.fillStyle = GRAY_4; 
	this.context.fillText(label, x+41, y+16);
	
	this.context.shadowOffsetX = 0;
	this.context.shadowOffsetY = 0;
	this.context.shadowBlur    = 0;
	
	var grad4 = this.context.createLinearGradient(x, y+10, x+10, y+20);
	grad4.addColorStop(0, DEEP_BLUE); grad4.addColorStop(1, HIGH_BLUE);
	this.context.fillStyle = grad4;
	this.context.lineWidth = 1;
	this.context.beginPath();
	this.context.arc(x+8, y+12, 5, 0, Math.PI*2, true);
	this.context.closePath();
	this.context.fill();
}

Grid.prototype.setRangeBox = function() 
{
	document.getElementById("selection").innerHTML = "";
	if (this.selectionLocation.left != undefined) {
		if (this.selection.col || this.selection.row) {
			var leftCol = ""; if (this.selection.col > 0) leftCol = columnCode(this.selection.col-1);
			var leftRow = this.selection.row;
			var range = "";	var rightCol = ""; var rightRow = "";

			if (this.selection.endRow != undefined && this.selection.endCol != undefined) {	// If it's not a single cell but a range
				if (this.selection.row != this.selection.endRow || this.selection.col != this.selection.endCol) { // and that range isn't a single cell
					range = ".."
					rightCol = "";
					if (this.selection.endCol > 0) {
						if (this.selection.col < this.selection.endCol) rightCol = columnCode(this.selection.endCol-1);
						else { rightCol = leftCol; leftCol = columnCode(this.selection.endCol-1); }
					}
					if (this.selection.row < this.selection.endRow) rightRow = this.selection.endRow;
					else { rightRow = leftRow; leftRow = this.selection.endRow; }
				}
			}
			if (leftRow == 0) leftRow = ""; if (rightRow == 0) rightRow = ""; 
			if (leftRow > 0) leftRow = "'" + leftRow; if (rightRow > 0) rightRow = "'" + rightRow; 

			SetTextStyle(this.context, {"align":"center"}); 	// Text header
			//this.context.fillText(leftCol + leftRow + range + rightCol + rightRow, this.selectionLocation.left, this.selectionLocation.top);
			document.getElementById("selection") .innerHTML = leftCol + leftRow + range + rightCol + rightRow;
		}
	}
}


Grid.prototype.colHeaderGradient = function(lightColor, midColor, darkColor) 
{
	var grad = this.context.createLinearGradient(0, this.gridTop, 0, this.RowHeight(0) + this.QUERY_BAR_HEIGHT -4);
	grad.addColorStop(0, lightColor); grad.addColorStop(.1, midColor); grad.addColorStop(1, darkColor);
	return grad;
}

function rowHeaderGradient(context, lightColor, midColor, darkColor, top, height) {
	var grad = context.createLinearGradient(0, top, 0, height);
	grad.addColorStop(0, lightColor); grad.addColorStop(.1, midColor); grad.addColorStop(1, darkColor);
	return grad;
}

Grid.prototype.drawQueryDropdownButton = function(left, top, width, height) 
{
	var grad = this.context.createLinearGradient(left, 0, this.width(), 0); grad.addColorStop(0, "#fafafa"); grad.addColorStop(.2, HIGH_BLUE); grad.addColorStop(1, LIGHT_BLUE);
	this.context.fillStyle = grad; 
	this.context.fillRect(left, top, width, height);		// Vertical scrollbar
	this.context.lineWidth = 1; this.context.strokeStyle = GRAY_A;	this.context.strokeRect(this.width() - this.SCROLLBAR_WIDTH, 3, this.SCROLLBAR_WIDTH, height);					

	var COMBO_TOP = top + 5.5; var COMBO_WIDTH = 4;
	this.context.lineWidth = 1;
	this.context.strokeStyle = "#333"; this.context.beginPath(); 
	this.context.moveTo(left + (width / 2.2) - COMBO_WIDTH, COMBO_TOP); this.context.lineTo(left + (width / 2.2), COMBO_TOP + 4); 
	this.context.lineTo(left + (width / 2.2) + COMBO_WIDTH, COMBO_TOP); this.context.stroke(); 
	this.context.moveTo(left + (width / 2.2) - COMBO_WIDTH, COMBO_TOP + 5); this.context.lineTo(left + (width / 2.2), COMBO_TOP + 9); 
	this.context.lineTo(left + (width / 2.2) + COMBO_WIDTH, COMBO_TOP + 5); this.context.stroke(); 
}