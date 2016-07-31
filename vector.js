function Vector(query, vectorElement, top, left, height, width, gridOptions) {		

	// Load positioning
	if (top == null)  this.top  = function() { return vectorElement.offsetTop; };  else this.top = top; 
	if (left == null) this.left = function() { return vectorElement.offsetLeft; }; else this.left = left; 
	if (height == null) this.height = function() { return window.innerHeight - this.top(); }; else this.height = height;
	this.width = width;
	this.blueDot = false;
	this.tool = 1;	// Default Line

	// Load Grid Options with defaults
	if (gridOptions.showVScrollbar === undefined) 	this.showVScrollbar = true; 	else this.showVScrollbar = gridOptions.showVScrollbar;
	if (gridOptions.showHScrollbar === undefined) 	this.showHScrollbar = true; 	else this.showHScrollbar = gridOptions.showHScrollbar;
	if (gridOptions.data === undefined) 				this.data = {}; 				else this.data = gridOptions.data; 	   						// e.g. {"A'1": "HELLO A1", "B'2": "HI B2!", "C'3":"9"};
	if (gridOptions.project === undefined) 			this.project = ""; 				else this.project = gridOptions.project;					// A unique project code, e.g. za4wF7

	this.data = {};
	this.selection = {};
	this.dragOffset = {};					// when dragging, this holds the original mouse-down offset
	this.vectorElement = vectorElement;
	
	this.functionSliderPosition = 84;
	this.functionSliderLimit = { "min" : 50, "max" : 100 };

	// Declare all object methods
	this.runQuery = runQuery; this.vector_mouseDown = vector_mouseDown; this.vector_mouseMove = vector_mouseMove; this.vector_mouseUp = vector_mouseUp; 
	this.vector_mouseDoubleClick = vector_mouseDoubleClick; this.mouseWheel = mouseWheel; this.mouseWheelGecko = mouseWheelGecko; 
	this.drawVectorCanvas = drawVectorCanvas; this.resetVectorCanvas = resetVectorCanvas; this.renderDrawing = renderDrawing; this.drawHandle = drawHandle;
	
	this.drawScrollArrow = drawScrollArrow; this.drawFunctionSlider = drawFunctionSlider; this.ensureSlideV = ensureSlideV; this.ensureSlideH = ensureSlideH; this.adjustSlideH = adjustSlideH; this.adjustSlideV = adjustSlideV; this.handleScrollObject = handleScrollObject; this.hitScrollObject = hitScrollObject;
	this.repeatScroll = repeatScroll; this.renderDrawing = renderDrawing; this.drawQueryDropdownButton = drawQueryDropdownButton;
	
	this.drawScrollbars = drawScrollbars; this.drawVerticalScrollbar = drawVerticalScrollbar; this.drawHorizontalScrollbar = drawHorizontalScrollbar; this.drawVSlider = drawVSlider; this.drawHSlider = drawHSlider; this.drawSliderBox = drawSliderBox; this.scrollTypesThatRepeat = scrollTypesThatRepeat;
	this.RowHeight = RowHeight; this.ColWidth = ColWidth; this.selectObjects = selectObjects; this.isSelected = isSelected; this.isOnHandle = isOnHandle;

	// Scroll
	this.inScroll = 0;
	this.inScrollOffset = 0;
	this.scroll = {"left" : 1, "top" : 1 };
	this.scrollInterval = 0;

	this.Resizing = {"None":0, "UpperLeft":1,  "UpperRight":2,  "LowerLeft":3,  "LowerRight":4};

	this.SCROLLBAR_WIDTH = 16.5;

	this.INIT_SLIDE_V = this.SCROLLBAR_WIDTH + 1 + (this.showQueryRibbon?22:0);
	this.INIT_SLIDE_H = this.SCROLLBAR_WIDTH + 1;

	this.slideV = this.INIT_SLIDE_V;
	this.slideH = this.INIT_SLIDE_H;
	

	this.SCROLL_SPEED = 15;  // Lower is faster
	this.SCROLL_INITIAL_DELAY = 250;  // When you press an arrow, it does one click and then waits to see if it should repeat

	this.SCROLL_SLIDER_LENGTH = 30;

	this.scrollVLimit = { "min" : this.slideV, "max" : (this.SCROLLBAR_WIDTH * 2) + this.SCROLL_SLIDER_LENGTH + 1};
	this.scrollHLimit = { "min" : this.slideH, "max" : (this.SCROLLBAR_WIDTH * 2) + this.SCROLL_SLIDER_LENGTH + 1};

	this.FUNCTION_SLIDER = 1;
	this.VERTICAL_SLIDER = 2;
	this.HORIZONTAL_SLIDER = 3;
	this.SCROLL_UP = 4;
	this.SCROLL_DOWN = 5;
	this.SCROLL_LEFT = 6;
	this.SCROLL_RIGHT = 7;
	this.VERTICAL_BAR = 8;
	this.HORIZONTAL_BAR = 9;

	this.inSelection = false;		// Selecting an object
	this.inCreation = false;		// Creating an object
	this.inDrag = false;			// Dragging an object
	this.inResize = 0;				// Resizing an object (0=Not resizing, 1=UpperLeft, 2=UpperRight, 3=LowerLeft, 4=LowerRight)
	this.rubberBand = {};			// The rubber band to select objects

	this.editingQuery = false;
	this.residualMouseUp = false;

	this.QUERY_BAR_HEIGHT = 0;
	if (this.showQueryRibbon) this.QUERY_BAR_HEIGHT = 30; else queryCtrl.style.display = "none";
	
	this.gridTop = 0;

	vectorElement.addEventListener('mousedown', this.vector_mouseDown, false);		// Attach the mousedown event listener
	vectorElement.addEventListener('mousemove', this.vector_mouseMove, false);		// Attach the mousemove event listener
	vectorElement.addEventListener('mouseup',   this.vector_mouseUp, false);		// Attach the mouseup event listeners
	vectorElement.addEventListener('dblclick', this.vector_mouseDoubleClick, false);		// Attach the double-click mouse event listener
	vectorElement.addEventListener('mousewheel', this.mouseWheel, false);			// Attach the double-click mouse event listener
	vectorElement.addEventListener('DOMMouseScroll', this.mouseWheelGecko, false);	// Attach the double-click mouse event listener

	if (vectorElement.getContext) {
		this.context = vectorElement.getContext("2d");
		if (document.getElementById("header") != null) drawHeader(false, true);
		if (location.hash.length > 1) runQuery();
		this.context.canvas.width  = this.width();
		this.context.canvas.height = this.height();
		if (this.propertyBox) { this.selection.col = 1; this.selection.row = 1; }
		this.drawVectorCanvas();
	}
}

function drawVectorCanvas() {

	this.resetVectorCanvas();
	this.renderDrawing();
	this.drawScrollbars();

	// Set project indicator
	if (this.project != "") {
		SetTextStyle(this.context, {"align":"center"});
		this.context.fillText(this.project, 38, 18);
	}
}

function resetVectorCanvas() {	// Clear the vector canvas
	this.vectorElement.width = this.vectorElement.width;
}

// MOUSE EVENTS
// :1: Rubberband
// :2: Select existing object
// :3: Create object

function vector_mouseDown(ev) {
	var event = resolveEvent(ev);
	var obj = grids.maingrid;
	obj.tool = grids.kidgrid.selection.row;
	obj.inSelection = (obj.tool == null || obj.tool == 1);
	obj.inCreation = !obj.inSelection;
	if (obj.inSelection) {
		obj.rubberBand.x1 = ev._x;
		obj.rubberBand.y1 = ev._y;
		obj.inResize = obj.isOnHandle(ev._x, ev._y);
		obj.inDrag = (obj.inResize == 0 && obj.selectObjects(true).length > 0);
		if (obj.inDrag) { 
			obj.selection = obj.selectObjects(true);
			obj.dragOffset.x = ev._x - parseInt(obj.data["A'" + obj.selection[0]]); 
			obj.dragOffset.y = ev._y - parseInt(obj.data["B'" + obj.selection[0]]); 
		}
	} 
	if (obj.inCreation) {
		var row = tmp_DataMaxRow(obj.data) + 1;
		obj.selection = row;
		obj.data["A'" + row] = ev._x;
		obj.data["B'" + row] = ev._y;
		obj.data["E'" + row] = grids.kidgrid.selection.row;	// Which tool selected
	}
}

function vector_mouseMove(ev) {
	var event = resolveEvent(ev);
	var obj = grids.maingrid;
	//var obj = grids[this.id];
	if (obj.inSelection) {
		if (obj.inResize > 0) {
			var row = obj.selection[0];
			var x = "A"; var y = "B";
			switch (obj.inResize) {
				case 2: x = "C"; break; 
				case 3: y = "D"; break; 
				case 4: x = "C"; y = "D"; break; 
			}
			obj.data[x + "'" + row] = ev._x;
			obj.data[y + "'" + row] = ev._y;
		}
		if (obj.inDrag) {
			for (var i=0; i < obj.selection.length; i++) {
				var row = obj.selection[i];
				obj.data["C'" + row] = parseInt(obj.data["C'" + row]) - ((obj.data["A'" + row] + obj.dragOffset.x) - ev._x);
				obj.data["D'" + row] = parseInt(obj.data["D'" + row]) - ((obj.data["B'" + row] + obj.dragOffset.y) - ev._y);
				obj.data["A'" + row] = ev._x - obj.dragOffset.x;
				obj.data["B'" + row] = ev._y - obj.dragOffset.y;
			}
		}
		if (obj.inResize == 0 && !obj.inDrag) {
			obj.rubberBand.x2 = ev._x;
			obj.rubberBand.y2 = ev._y;
			obj.selection = obj.selectObjects(false);
		}
		obj.drawVectorCanvas();
	} 
	if (obj.inCreation) {
		obj.data["C'" + obj.selection] = ev._x;
		obj.data["D'" + obj.selection] = ev._y;
		obj.drawVectorCanvas();
	}
}
function vector_mouseUp(ev) {
	//var obj = grids[this.id];
	var obj = grids.maingrid;

	if (obj.inSelection || obj.inResize > 0) {
		obj.inDrag = false;
		obj.resetVectorCanvas()
		obj.inCreation = false;
		obj.selection = obj.selectObjects(false);
		obj.inSelection = false;
		obj.rubberBand = {};
		obj.renderDrawing();
		obj.drawScrollbars();
	}
	if (obj.inCreation) {
		obj.inSelection = false;
		obj.inCreation = false;	
		var row = obj.selection;
		obj.selection = [];
		obj.selection[0] = row;
		grids.kidgrid.selection = {"row":1, "col":1, "endRow":1, "endCol":1};
		grids.kidgrid.drawFullSheet();
		resetToolbarDrawingButtons();
	}
	if (obj.inScroll) {
		obj.inScroll = 0;
		obj.scrollInterval = 0;
		obj.drawVectorCanvas();
	}
}
function vector_mouseDoubleClick(ev) {
	var event = resolveEvent(ev);
	var obj = grids[this.id];	
}

function renderDrawing() {		

	for (key in this.data) {
		if (key == "clone") continue;
		var row = key.substring(key.indexOf("'")+1);
		var tool = this.data["E'" + row];
		this.context.strokeStyle = "black";
		this.context.lineWidth = 2;
		var x1 = parseInt(this.data["A'" + row]);
		var y1 = parseInt(this.data["B'" + row]);
		var x2 = parseInt(this.data["C'" + row]);
		var y2 = parseInt(this.data["D'" + row]);
		if (tool != null && this.data["C'" + row] != null) {
			switch (parseInt(tool)) {
			case (2):	// Line
				this.context.beginPath();
				this.context.moveTo(x1, y1);
				this.context.lineTo(x2, y2);
				this.context.closePath();
				this.context.stroke(); 
				break;
			case (3):	// Rect
				this.context.strokeRect(x1, y1, x2 - x1, y2 - y1);
				break;
				
			case (4):	// Ellipse
				drawEllipse(this.context,x1, y1, x2 - x1, y2 - y1);
				break;
			}
		}
		
		// Draw selection handles
		if ((this.inCreation && this.selection == row) || (!this.inCreation && this.isSelected(this.selection, row))) {
			this.drawHandle(x1, y1);
			this.drawHandle(x2, y2);
			if (parseInt(tool) > 2) {
				this.drawHandle(x1, y2);
				this.drawHandle(x2, y1);
			}
		}
	
	}
	
	if (this.inSelection) {
		drawAntRectangle(this.context,this.rubberBand.x1, this.rubberBand.y1, this.rubberBand.x2, this.rubberBand.y2);
	} 
}
function selectObjects(firstOnly) {
	var hits = [];
	for (key in this.data) {
		if (key == "clone") continue;
		var row = key.substring(key.indexOf("'")+1);
		var tool = this.data["E'" + row];
		var x1 = parseInt(this.data["A'" + row]);
		var y1 = parseInt(this.data["B'" + row]);
		var x2 = parseInt(this.data["C'" + row]);
		var y2 = parseInt(this.data["D'" + row]);
		if (this.rubberBand.x2 === undefined) this.rubberBand.x2 = this.rubberBand.x1; // if user just clicked a point
		if (this.rubberBand.y2 === undefined) this.rubberBand.y2 = this.rubberBand.y1; // if user just clicked a point
		if (!((this.rubberBand.x1 < x1 && this.rubberBand.x2 < x1 || this.rubberBand.x1 > x2 && this.rubberBand.x2 > x2) ||
			(this.rubberBand.y1 < y1 && this.rubberBand.y2 < y1 || this.rubberBand.y1 > y2 && this.rubberBand.y2 > y2)	)) {	
			if (!this.isSelected(hits, row)) hits[hits.length] = row;
			if (firstOnly) break;
		}
	}
	if (hits.length == 0) hits = {}; 
	return hits;
}
function isSelected(hits, row) {
	if (hits.length == 0) return false;
	for (var i=0; i < hits.length; i++) if (hits[i] == row) return true;
	return false;
}
function tmp_DataMaxRow(data) { // Just a temp quick function to fake out unique row on inserts
	var maxRow = 1;
	for (key in data) {
		var row =  (key != 'clone') ? key.substring(key.indexOf("'")+1) : 1;
		maxRow = Math.max(maxRow, row);
	}
	return maxRow;
}
function drawEllipse(ctx, x, y, w, h) {  // By Steve Tranby
  var kappa = .5522848;
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
  ctx.stroke();
}

function drawAntRectangle(ctx, x1, y1, x2, y2) {
	ctx.lineWidth = 1;	
	if (Math.max(x1,x2) == x1) {
		for (i = x2; i < x1; i+=4) { antRectX(ctx, "#000", i, y1); antRectX(ctx, "#ccc", i+1, y1); }
		for (i = x2; i < x1; i+=4) { antRectX(ctx, "#000", i, y2); antRectX(ctx, "#ccc", i+1, y2); }
	} else {
		for (i = x1; i < x2; i+=4) { antRectX(ctx, "#000", i, y1); antRectX(ctx, "#ccc", i+1, y1); }
		for (i = x1; i < x2; i+=4) { antRectX(ctx, "#000", i, y2); antRectX(ctx, "#ccc", i+1, y2); }
	}
	if (Math.max(y1,y2) == y1) {
		for (i = y2; i < y1; i+=4) { antRectY(ctx, "#000", x1, i+1); antRectX(ctx, "#ccc", x1, i); }
		for (i = y2; i < y1; i+=4) { antRectY(ctx, "#000", x2, i+1); antRectX(ctx, "#ccc", x2, i); }
	} else {
		for (i = y1; i < y2; i+=4) { antRectY(ctx, "#000", x1, i+1); antRectX(ctx, "#ccc", x1, i); }
		for (i = y1; i < y2; i+=4) { antRectY(ctx, "#000", x2, i+1); antRectX(ctx, "#ccc", x2, i); }
	}
}

function antRectX(ctx, color, i, y) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(i++, y + 0.5);
	ctx.lineTo(i, y + 0.5);
	ctx.closePath();
	ctx.stroke();		
}
function antRectY(ctx, color, x, i) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(x + 0.5, i++);
	ctx.lineTo(x + 0.5, i);
	ctx.closePath();
	ctx.stroke();		
}
function drawHandle(x, y) {
	if (isNumber(x) && isNumber(y)) {
		//var gradHandle = this.context.createRadialGradient(x-4, y-4, 0, x+4, y+4, 8);
		//gradHandle.addColorStop(0, GLOW_BLUE); gradHandle.addColorStop(1, DEEP_BLUE);
		this.context.fillStyle = "blue"; //gradHandle;
		this.context.lineWidth = 1;
		this.context.beginPath();
		this.context.arc(x, y, 4, 0, Math.PI*2, true);
		this.context.closePath();
		this.context.fill();
	}
}

function isOnHandle(x, y) {
	for (var i=0; i < this.selection.length; i++) {
		var row = this.selection[i];
		var tool = this.data["E'" + row];

		var x1 = parseInt(this.data["A'" + row]);
		var y1 = parseInt(this.data["B'" + row]);
		var x2 = parseInt(this.data["C'" + row]);
		var y2 = parseInt(this.data["D'" + row]);
		if (around(x, x1, 2) && around(y, y1, 2)) return this.Resizing.UpperLeft;
		if (around(x, x2, 2) && around(y, y2, 2)) return this.Resizing.LowerRight;
		if (tool > 1) {
			if (around(x, x2, 2) && around(y, y1, 2)) return this.Resizing.UpperRight;
			if (around(x, x1, 2) && around(y, y2, 2)) return this.Resizing.LowerLeft;
		}
	}
	return this.Resizing.None;
}
