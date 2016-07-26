var gridInEdit;		// Holds the selected grid 
//var grids = [];
var grids = {};
var gssSolverContext={};
var queryCtrl, selCtrl, functionSliderCtrl, ieditor;
var editorType = 'grid';
var toolbar_grid = { "new" : {left:144, type:"button"} ,
				"fontface" : {left:170, width:94, type:"custom"} ,
			    "fontsize" : {left:276, width:43, type:"custom"} ,
			    "fontsizeup" : {left:321, type:"button"} ,
			    "fontsizedown" : {left:344, type:"button"} ,
			    "valignup" : {left:377, type:"button"} ,
			    "valigncenter" : {left:400, type:"button"} ,
			    "valigndown" : {left:424, type:"button"} ,
			    "bold" : {left:453, type:"button"} ,
			    "italic" : {left:476, type:"button"} ,
			    "underline" : {left:500, type:"dropbutton"} ,
			    "border" : {left:537, type:"dropbutton"} ,
			    "backcolor" : {left:574, type:"dropbutton"} ,
			    "forecolor" : {left:608, type:"dropbutton"} ,
			    "alignleft" : {left:652, type:"button"} ,
			    "aligncenter" : {left:675, type:"button"} ,
			    "alignright" : {left:700, type:"button"} ,
			    "propbox" : {left:730, type:"toggle", "show" : false} ,
			    "kidgrid" : {left:752, type:"toggle", "show" : false} ,
			    "vector" : {left:778, type:"button"} };
				
var toolbar_vector = { "new" : {left:144, type:"button"} ,
			    "select" : {left:177, type:"toggle", "show" : true} ,
			    "line" : {left:201, type:"toggle", "show" : false} ,
			    "rect" : {left:224, type:"toggle", "show" : false} ,
			    "oval" : {left:248, type:"toggle", "show" : false} ,
			    "text" : {left:272,  type:"toggle", "show" : false} ,
			    "propbox" : {left:707, type:"toggle", "show" : false} ,
			    "kidgrid" : {left:729, type:"toggle", "show" : false} ,
			    "editor" : {left:752, type:"button"} ,
			    "template" : {left:780, type:"button"} };
var toolbar = toolbar_grid;

function loadKayia() {
	//document.designMode = 'on';
	queryCtrl = document.getElementById("query"); 
	selCtrl = document.getElementById("selector"); 
	functionSliderCtrl = document.getElementById("functionslider"); 
	ieditor = document.getElementById("ieditor");

	if (document.getElementById("header") == null) { 
		document.getElementById("headerBar").style.background = "";
	} else {
		document.getElementById("header").addEventListener('mousedown',  header_mouseDown, false);	// Attach the mousedown event listener
	}

	if (location.hash.length > 1) { 
		selCtrl.value = '';
		queryCtrl.value = location.hash.substr(1);
	}
	selCtrl.addEventListener('keydown',  query_keypress, false);	// Attach the keypress event listener
	selCtrl.addEventListener('focus',  query_focus, false);		// Attach the focus event listener
	queryCtrl.addEventListener('keydown',  query_keypress, false);	// Attach the keypress event listener
	queryCtrl.addEventListener('focus',  query_focus, false);		// Attach the focus event listener
	functionSliderCtrl.addEventListener('mousedown',  function(){document.movingelement=this;}, false);
	document.addEventListener('mouseup',  function(){document.movingelement=0;}, false);
//	functionSliderCtrl.addEventListener('mouseleave',  function(){this.mousedown=0;}, false);
	document.addEventListener(
		'mousemove',  
		function(ev){
			if(this.movingelement && this.movingelement == functionSliderCtrl){
				window.engine.solve({cxfs:ev.x});
//				this.movingelementx.left=cxfs
			}
//			this.left=ev.x;
//			window.engine.solve({cxfs:ev.x});
		}, 
		false);
//	$("#functionslider")
//		.bind("mousedown", {mouseisdown: 1}, mouseUpDown)
//		.bind("mouseup", {mouseisdown: 0}, mouseUpDown)
//		.bind('mousemove',{},function(ev){if(!this.mouseisdown){return;};this.left=ev.x});
	
	document.addEventListener('keydown',  keypress, false);		// Attach the keypress event listener
	
	selLeft = window.innerWidth - document.getElementById("maingrid").offsetLeft;
	document.getElementById("vector").style.display='none';
	grids.maingrid = new Grid(null, document.getElementById("maingrid"), null, null, null, null,
					{"project": "", "showQueryRibbon": false, "selectionLocation": {"left": selLeft, "top": 18}} );		//, "col_override" : { "B" : "Name" }
	
	grids.kidgrid = new Grid(queryCtrl.value + '', document.getElementById("kidgrid"), 
		null, null, null, null,{});
//		/* Top */ function()  { return 52; },
//		/* Left */  function()  { return window.innerWidth - 300; }, 
//		/* Height */ function()  {return window.innerHeight - 152; },
//		/* Width */  function()  { return 300; }, {} );

	grids.propbox = new Grid(queryCtrl.value + '', document.getElementById("propbox"), 
		null, null, null, null,
//		/* Top */ function()  {return window.innerHeight - 152; },
//		/* Left */  function()  { return window.innerWidth - 300; }, 
//		/* Height */ function()  {return 98; },
//		/* Width */  function()  { return 300; }, 
		{"showBlueDot": false, "showColHeader": false, "showRowHeader": false, "showHScrollbar": false, "propertyBox": true, 
		"colWidths":{"1":120, "2":155}, "data" : {"A'1": "Name", "A'2":"Alignment","A'3":"Border", "A'4":"Font"} } );
}

window.onresize = loadKayia;


// ======== FOCUS FIX ===========

var savedRange,isInFocus;
function saveSelection()
{
    if(window.getSelection)//non IE Browsers
    {
        savedRange = window.getSelection().getRangeAt(0);
    }
    else if(document.selection)//IE
    { 
        savedRange = document.selection.createRange();  
    } 
}

function restoreSelection()
{
    isInFocus = true;
    ieditor.focus();
    if (savedRange != null) {
        if (window.getSelection)//non IE and there is already a selection
        {
            var s = window.getSelection();
            if (s.rangeCount > 0) 
                s.removeAllRanges();
            s.addRange(savedRange);
        }
        else 
            if (document.createRange)//non IE and no selection
            {
                window.getSelection().addRange(savedRange);
            }
            else 
                if (document.selection)//IE
                {
                    savedRange.select();
                }
    }
}
//this part onwards is only needed if you want to restore selection onclick
var isInFocus = false;
function onDivBlur()
{
    //isInFocus = false;
	gridInEdit.finishEdit();
}

function cancelEvent(e)
{
    if (isInFocus == false && savedRange != null) {
        if (e && e.preventDefault) {
            //alert("FF");
            e.stopPropagation(); // DOM style (return false doesn't always work in FF)
            e.preventDefault();
        }
        else {
            window.event.cancelBubble = true;//IE stopPropagation
        }
        restoreSelection();
        return false; // false = IE style
    }
}
