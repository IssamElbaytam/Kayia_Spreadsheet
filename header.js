var header_ctx; 
var toolset = ['select','line','rect','oval','text']; 	// For drawing

function drawHeader() {
	var header = document.getElementById("header");
	header.width = 804;
	header.height = 30;

	header_ctx = header.getContext("2d");

	header_ctx.drawImage(document.getElementById("toolbar"), 140, 0);
	showToggledButtons();

	drawTitle();
	drawLogo();
}

function drawTitle() {
	var grad = header_ctx.createLinearGradient(0, 0, 0, 28);
	grad.addColorStop(0, OCEAN_BLUE);
	grad.addColorStop(.3, "#00BEFE");
	grad.addColorStop(1, "#008ED1");
	header_ctx.fillStyle = grad;

	header_ctx.shadowOffsetX = .5;
	header_ctx.shadowOffsetY = .5;
	header_ctx.shadowBlur    = 1;
	header_ctx.shadowColor   = 'rgba(210, 210, 210, 25)';

	header_ctx.font = "italic bold 18pt Arial, Geneva, sans-serif";
	header_ctx.fillText("Kayia", 40, 22);
}

function drawHeaderButton(x, y, w, h) {
	header_ctx.lineWidth = 3;
	header_ctx.fillStyle = 'rgba(255, 255, 255, .3)'; 
	header_ctx.fillRect(x, y, w, h);
	header_ctx.strokeStyle = 'rgba(255, 255, 255, .8)';  
	header_ctx.strokeRect(x, y, w, h);
}

function drawLogo() {

	header_ctx.shadowColor = OCEAN_BLUE;
	
	var topOffset = 20; //40;
	var bottomOffset = 6; //13;
	var rightOffset = 17; //34;
	
	var redLine    = {"x1":11,"y1":11};		//{"x1":15,"y1":18,"x2":55,"y2":18}
	redLine.x2 = redLine.x1 + topOffset;	redLine.y2 = redLine.y1;	
	
	var blueLine   = {"x1":9,"y1":17};		//{"x1":10,"y1":30,"x2":50,"y2":30}
	blueLine.x2 = blueLine.x1 + topOffset;	blueLine.y2 = blueLine.y1;	
	
	var yellowLine = {"x1":20,"y1":6};		//{"x1":33,"y1":8 ,"x2":20,"y2":42}
	yellowLine.x2 = yellowLine.x1 - bottomOffset; yellowLine.y2 = yellowLine.y1 + rightOffset;	
	
	var greenLine  = {"x1":26,"y1":6};		//{"x1":45,"y1":8 ,"x2":32,"y2":42}
	greenLine.x2 = greenLine.x1 - bottomOffset;	greenLine.y2 = greenLine.y1 + rightOffset;	
	
	drawLogoLine(redLine,    2, "#FFF");	
	drawLogoLine(blueLine,   2, "#FFF");
	drawLogoLine(yellowLine, 2, "#FFF");
	drawLogoLine(greenLine,  2, "#FFF");	

	drawLogoLine(redLine,  0, "#FFF");	// Red and blue again, without shadow
	drawLogoLine(blueLine, 0, "#FFF");
}

function drawLogoLine(line, blur, color) {
	drawLogoLineI(line, blur, blur, blur, color);
	drawLogoLineI(line, -blur, blur, blur, color);
	drawLogoLineI(line, blur, -blur, blur, color);
	drawLogoLineI(line, -blur, -blur, blur, color);
}
function drawLogoLineI(line, ox, oy, blur, color) {
	header_ctx.shadowOffsetX = ox;
	header_ctx.shadowOffsetY = oy;
	header_ctx.shadowBlur    = blur;
	header_ctx.shadowColor   = '#00BEFE';
	header_ctx.fillStyle = color;
	drawLogoCircle(line.x1, line.y1);
	drawLogoCircle(line.x2, line.y2);
	
	header_ctx.lineWidth = 1;
	header_ctx.strokeStyle = color; 
	header_ctx.beginPath(); 
	header_ctx.moveTo(line.x1, line.y1); 
	header_ctx.lineTo(line.x2, line.y2); 
	header_ctx.stroke();
}
function drawLogoCircle(x1, y1) {
	header_ctx.lineWidth = 1;
	header_ctx.beginPath();
	header_ctx.arc(x1, y1, 2, 0, Math.PI*2, true);
	header_ctx.closePath();
	header_ctx.fill();
}

function hitHeaderObject(x, y) {
var BUTTON = 21;
var DROPBUTTON = 34;

	if (y > 5 && y < 27) {
		for (var ctrl in toolbar) {
			if (ctrl != 'clone' && x > toolbar[ctrl].left) {
				if (toolbar[ctrl].type == "custom" && x < toolbar[ctrl].left + ctrl.width) return ctrl;
				if ((toolbar[ctrl].type == "button" || toolbar[ctrl].type == "toggle") && x < toolbar[ctrl].left + BUTTON) return ctrl;
				if (toolbar[ctrl].type == "dropbutton" && x < toolbar[ctrl].left + DROPBUTTON) return ctrl;
			}
		}
	}
	return "";
}

function header_mouseDown(ev) {
	var event = resolveEvent(ev);
	//alert(ev._x + ',' + ev._y);
	var hitButton = hitHeaderObject(ev._x, ev._y);
	if (toolbar[hitButton].type == "toggle") { 
		toolbar[hitButton].show = (!toolbar[hitButton].show); 
		for (var i=0; i < toolset.length; i++) {
			if (hitButton == toolset[i]) {
				toolbar['select'].show = false;
				grids.kidgrid.selection = {"row":i +1, "col":1, "endRow":i+1, "endCol":1};
				grids.kidgrid.drawFullSheet();
			}
		}
		drawHeader(); 
	} else {
		if (hitButton == "vector") changeEditor('vector');		// change to the vector editor 
		if (hitButton == "editor") changeEditor('grid');		// change to the grid editor 
		if (hitButton == "template") window.open('template.htm', 'Template for Publishing', 'height=450,width=600');	// TODO: generated from queryCtrl
	}
	//alert(hitButton);
}

function showToggledButtons() {
	for (var ctrl in toolbar) {
		if (toolbar[ctrl].show) drawHeaderButton(toolbar[ctrl].left + 2, 8, 17, 15);
	}
}

function resetToolbarDrawingButtons() {
	grids.kidgrid.selection.row = 1;
	for (var ctrl in toolbar) {
		if (toolbar[ctrl].type == "toggle") 
			for (var i=1; i < toolset.length; i++) 
				if (toolset[i] == ctrl) toolbar[ctrl].show = false;
	}
	toolbar['select'].show = true;
	drawHeader(); 
}

function changeEditor(toType) {
	if (toType == 'grid') {
		editorType = 'grid';
		grids.kidgrid.showBlueDot = true;
		grids.kidgrid.showColHeader = true;
		grids.kidgrid.showRowHeader = true;
		grids.kidgrid.showHScrollbar = true;
		grids.kidgrid.propertyBox = true;
		grids.kidgrid.colWidths = {"1":50};
		grids.kidgrid.data = {};
		grids.kidgrid.width = grids.kidgrid.width;
		toolbar = toolbar_grid;
		document.getElementById('toolbar').src = 'toolbar.png';
		drawHeader();
		document.getElementById('vector').style.display = 'none';
		document.getElementById('maingrid').style.display = 'block';
		grids.maingrid = new Grid(null, document.getElementById("maingrid"), null, null, null, function()  { return window.innerWidth - this.left() - 300; }, 
					{"project": "", "showQueryRibbon": true, "selectionLocation": {"left": window.innerWidth - document.getElementById("maingrid").offsetLeft - 400, "top": 18}} );
		document.getElementById('header').width = document.getElementById('header').width + 1;
		document.getElementById('header').width = document.getElementById('header').width - 1;
	} else 
	if (toType == 'vector') {
		editorType = 'vector';
		grids.kidgrid.showBlueDot = false;
		grids.kidgrid.showColHeader = false;
		grids.kidgrid.showRowHeader = false;
		grids.kidgrid.showHScrollbar = false;
		grids.kidgrid.propertyBox = true;
		grids.kidgrid.colWidths = {"1":275};
		grids.kidgrid.data = {"A'1": "Selection", "A'2":"Line","A'3":"Rectangle", "A'4":"Oval"};
		grids.kidgrid.width = grids.kidgrid.width;
		toolbar = toolbar_vector;
		document.getElementById('toolbar').src = 'toolbar_v.png';
		drawHeader();
		document.getElementById('header').width = document.getElementById('header').width - 1;
		document.getElementById('maingrid').style.display = 'none';
		document.getElementById('vector').style.display = 'block';
		grids.maingrid = new Vector(queryCtrl.value + '', document.getElementById("vector"), null, null, null, function()  { return window.innerWidth - this.left() - 300; }, 
				{"showQueryRibbon": false});
		drawHeader();
		document.getElementById('header').width = document.getElementById('header').width + 1;
		document.getElementById('header').width = document.getElementById('header').width - 1;
		showToggledButtons();
	}
	drawTitle();
	drawLogo();
}