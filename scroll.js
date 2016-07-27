
Grid.prototype.initializeScrollbars = function() 
{
	this.inScroll = 0;
	this.inScrollOffset = 0;
	this.scroll = {"left" : 1, "top" : 1 };
	this.scrollInterval = 0;

	this.SCROLLBAR_WIDTH = 16.5;

	this.INIT_SLIDE_V = this.SCROLLBAR_WIDTH + 1 + (this.showQueryRibbon?22:0);
	this.INIT_SLIDE_H = this.SCROLLBAR_WIDTH + 1;

	this.slideV = this.INIT_SLIDE_V;
	this.slideH = this.INIT_SLIDE_H;

	this.SCROLL_SPEED = 15;  // Lower is faster
	this.SCROLL_INITIAL_DELAY = 250;  // When you press an arrow, it does one click and then waits to see if it should repeat

	this.H_SCROLLBAR_OFFSET = 40;
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
}

Grid.prototype.hitScrollObject = function(x, y) 
{
	//console.log('x=' + x + ',y=' + y + ',context.canvas.width=' + context.canvas.width + ', height=' + this.height()); //85,4 : 104,20
	// FUNCTION_SLIDER
//	if (x > this.functionSliderPosition && x < (this.functionSliderPosition + 20) && y > 3 && y < 20) { this.inScrollOffset = x - this.functionSliderPosition; return this.FUNCTION_SLIDER; }		

	// VERTICAL_SLIDER
	if (x > (this.width() - this.SCROLLBAR_WIDTH) && x <= this.width() && y > this.slideV && y < (this.slideV + this.SCROLL_SLIDER_LENGTH)) { this.ensureSlideV(); this.inScrollOffset = y - this.slideV;  return this.VERTICAL_SLIDER; }		

	// SCROLL_UP
	if (x > (this.width() - this.SCROLLBAR_WIDTH) && x <= this.width() && y < this.QUERY_BAR_HEIGHT + this.SCROLLBAR_WIDTH && y > this.QUERY_BAR_HEIGHT) { return this.SCROLL_UP; }		

	// SCROLL_DOWN
	if (x > (this.width() - this.SCROLLBAR_WIDTH) && x <= this.width() && y > (this.height() - this.SCROLLBAR_WIDTH * 2) && y < (this.height() - this.SCROLLBAR_WIDTH)) { return this.SCROLL_DOWN; }		

	// HORIZONTAL_SLIDER
	if (x > this.slideH && x < (this.slideH + this.SCROLL_SLIDER_LENGTH) && y > (this.height() - this.SCROLLBAR_WIDTH) && y <= this.height()) { this.ensureSlideH(); this.inScrollOffset = x - this.slideH; return this.HORIZONTAL_SLIDER; }

	// SCROLL_LEFT
	if (x < this.SCROLLBAR_WIDTH && y > (this.height() - this.SCROLLBAR_WIDTH) && y <= this.height()) { return this.SCROLL_LEFT; }	

	// SCROLL_RIGHT
	if (x > (this.width() - (this.SCROLLBAR_WIDTH * 2)) && x <= (this.width() - this.SCROLLBAR_WIDTH) && y > (this.height() - this.SCROLLBAR_WIDTH) && y <= this.height()) { return this.SCROLL_RIGHT; }		

	// VERTICAL_BAR
	if (x > (this.width() - this.SCROLLBAR_WIDTH) && x <= this.width()) { return this.VERTICAL_BAR; }		

	// HORIZONTAL_BAR
	if (y > (this.height() - this.SCROLLBAR_WIDTH) && y <= this.height()) { return this.HORIZONTAL_BAR; }

	// No Hit
	return 0;
}

Grid.prototype.handleScrollObject = function(x, y) 
{
	//console.log('this.inScroll=' + this.inScroll);
	switch (this.inScroll) {
		case this.FUNCTION_SLIDER:  	this.functionSliderPosition = x - this.inScrollOffset;  this.drawFullSheet();  break;	// Function Slider
		case this.VERTICAL_SLIDER:  	this.adjustSlideV(y - this.inScrollOffset); 	break;  // Vertical Scroll Slider
		case this.HORIZONTAL_SLIDER: 	this.adjustSlideH(x - this.inScrollOffset);		break;	// Horizontal Scroll Slider
		case this.SCROLL_UP: 			this.adjustSlideV(this.slideV - 1); 			break; 	// Scrollbar Up Arrow
		case this.SCROLL_DOWN:  		this.adjustSlideV(this.slideV + 1);				break;	// Scrollbar Down Arrow
		case this.SCROLL_LEFT:  		this.adjustSlideH(this.slideH - 1);				break;	// Scrollbar Left Arrow
		case this.SCROLL_RIGHT:  		this.adjustSlideH(this.slideH + 1);				break;	// Scrollbar Right Arrow
//		case this.VERTICAL_BAR:  		if (y < this.slideV) this.adjustSlideV(this.slideV - 5); else this.adjustSlideV(this.slideV + 5); break;	// Vertical Scrollbar 
//		case this.HORIZONTAL_BAR:    	if (x < this.slideH) this.adjustSlideH(this.slideH - 5); else this.adjustSlideH(this.slideH + 5); break;	// Horizontal Scrollbar
		case this.VERTICAL_BAR:  	if (y < this.slideV) this.inScroll = this.SCROLL_UP; else this.inScroll = this.SCROLL_DOWN; this.handleScrollObject(x,y);break;	// Vertical Scrollbar 
		case this.HORIZONTAL_BAR:    	if (x < this.slideH) this.inScroll = this.SCROLL_LEFT; else this.inScroll = this.SCROLL_RIGHT; this.handleScrollObject(x,y); break;	// Horizontal Scrollbar
	}
}
function handleScrollObject2(x, y) { try { tmpGridObject.handleScrollObject(x, y); } catch (e) {} }


Grid.prototype.repeatScroll = function(x, y) 
{
	if (this.scrollInterval > 0 && this.inScroll > 0) {
		window.clearTimeout(this.scrollInterval);
		this.scrollInterval = window.setInterval(this.handleScrollObject(x, y), this.SCROLL_SPEED);
	}
}

function repeatScroll2(x, y) 
{ 
	if (tmpGridObject.scrollInterval > 0 && tmpGridObject.inScroll > 0) {
		window.clearTimeout(tmpGridObject.scrollInterval);
		tmpGridObject.scrollInterval = window.setInterval("handleScrollObject2(" + x + "," + y + ")", tmpGridObject.SCROLL_SPEED);
	}
}

Grid.prototype.adjustSlideV = function(newValue) 
{
	this.slideV = newValue; 
	this.ensureSlideV();
	this.scroll.top = this.slideV - this.INIT_SLIDE_V + 1;
	this.drawFullSheet();
}

Grid.prototype.adjustSlideH = function(newValue) 
{
	this.slideH = newValue; 
	this.ensureSlideH();
	this.scroll.left = this.slideH - this.INIT_SLIDE_H + 1;
	this.drawFullSheet();
}

Grid.prototype.ensureSlideV = function() 
{
	if (this.slideV < this.scrollVLimit.min) this.slideV = this.scrollVLimit.min;
	if (this.slideV > (this.height() - this.scrollVLimit.max)) this.slideV = this.height() - this.scrollVLimit.max;
}

Grid.prototype.ensureSlideH = function() 
{
	if (this.slideH < this.scrollHLimit.min) this.slideH = this.scrollHLimit.min;
	if (this.slideH > (this.width() - this.scrollHLimit.max)) this.slideH = this.width() - this.scrollHLimit.max;
}

Grid.prototype.drawScrollbars = function() 
{
	if (this.showVScrollbar) this.drawVerticalScrollbar();
	if (this.showHScrollbar) this.drawHorizontalScrollbar();
}

Grid.prototype.drawScrollArrow = function(grad, left, top, width, height, upDown, offsetA, offsetB, offsetC) 
{
	this.context.fillStyle = grad; 
	this.context.fillRect(left, top, width - 1, height);		// Vertical scrollbar

	this.context.fillStyle = GRAY_4;
	this.context.beginPath(); 
	if (upDown) {
		this.context.moveTo(left + (width / 2)    , top + offsetA); 
		this.context.lineTo(left + (width / 2) - 4, top + offsetB); 
		this.context.lineTo(left + (width / 2) + 4, top + offsetC); 
	} else {
		this.context.moveTo(left + offsetA, top + (height / 2)    ); 
		this.context.lineTo(left + offsetB, top + (height / 2) - 4); 
		this.context.lineTo(left + offsetC, top + (height / 2) + 4); 
	}
	this.context.fill(); 
	this.context.closePath(); 

	this.context.lineWidth = 1; this.context.strokeStyle = LIGHT_BLUE;	this.context.strokeRect(left, top, width, .5);
	this.context.lineWidth = 1; this.context.strokeStyle = GRAY_A; 		this.context.strokeRect(left, top, width-1, height);
}
					

Grid.prototype.drawVerticalScrollbar = function() 
{
	this.context.fillStyle = HIGHLIGHT; 
	this.context.fillRect(this.width() - this.SCROLLBAR_WIDTH-1, this.RowHeight(0) - 6, this.SCROLLBAR_WIDTH+1, this.height() - ((this.showHScrollbar?this.SCROLLBAR_WIDTH:0) +(this.blueDot?this.SCROLLBAR_WIDTH:0) ));		// Vertical scrollbar

	// Combo Button 
	if (this.showQueryRibbon) this.drawQueryDropdownButton(this.width() - this.SCROLLBAR_WIDTH, 3.5, this.SCROLLBAR_WIDTH+2, this.QUERY_BAR_HEIGHT - 1);
	
	var grad = this.context.createLinearGradient(this.width() - this.SCROLLBAR_WIDTH, 0, this.width(), 0); grad.addColorStop(0, "#fafafa"); grad.addColorStop(.2, HIGH_BLUE); grad.addColorStop(1, DARK_BLUE);
	// Up Arrow
	this.drawScrollArrow(grad, this.width() - this.SCROLLBAR_WIDTH, this.gridTop, this.SCROLLBAR_WIDTH, this.SCROLLBAR_WIDTH, true, 6, 10, 10);
	// Down Arrow 
	this.drawScrollArrow(grad, this.width() - this.SCROLLBAR_WIDTH, this.height() - this.SCROLLBAR_WIDTH - (this.blueDot?this.SCROLLBAR_WIDTH:0) - 1, this.SCROLLBAR_WIDTH, this.SCROLLBAR_WIDTH, true, 10, 6, 6);

	// Vertical Slider 
	this.drawVSlider();
}

Grid.prototype.drawVSlider = function() 
{
	var barHeight = this.SCROLL_SLIDER_LENGTH;
	var grad = this.context.createLinearGradient(this.width() - this.SCROLLBAR_WIDTH, 0, this.width(), 0); 
	this.drawSliderBox(grad, this.width() - this.SCROLLBAR_WIDTH, this.slideV, this.SCROLLBAR_WIDTH - 1, barHeight);

	// Slash marks
	this.context.strokeStyle = DEEP_BLUE; 
	this.context.beginPath(); 
	var mark = this.slideV + Math.floor(barHeight / 2.7);
	for (var i = 0; i < 3; i++) {
		this.context.moveTo(this.width() - this.SCROLLBAR_WIDTH + 5,  mark+(3*i)); 
		this.context.lineTo(this.width() - this.SCROLLBAR_WIDTH + 12, mark+(3*i)); 
		this.context.stroke();
	}
}

Grid.prototype.drawHorizontalScrollbar = function() 
{
//	var grad = this.context.createLinearGradient(this.left(), this.height() - this.SCROLLBAR_WIDTH, this.left(), this.height());	
	var grad = this.context.createLinearGradient(0, this.height() - this.SCROLLBAR_WIDTH, 0, this.height());	
	grad.addColorStop(0, "white"); grad.addColorStop(.1, HIGH_BLUE); grad.addColorStop(1, DARK_BLUE);
	
	this.context.fillStyle = HIGHLIGHT; 
	this.context.fillRect(0, this.height()-this.SCROLLBAR_WIDTH - 1, this.width()-this.SCROLLBAR_WIDTH, this.SCROLLBAR_WIDTH+1);		// Horizontal scrollbar	

	// Left Arrow ---------------------------------------------------------------------------------------------------------------------------------------------------
	this.drawScrollArrow(grad, 1, this.height() - this.SCROLLBAR_WIDTH, this.SCROLLBAR_WIDTH , this.SCROLLBAR_WIDTH, false, 6, 10, 10)
	
	// Right Arrow ---------------------------------------------------------------------------------------------------------------------------------------------------
	this.drawScrollArrow(grad, this.width() - this.SCROLLBAR_WIDTH - this.SCROLLBAR_WIDTH, this.height() - this.SCROLLBAR_WIDTH, this.SCROLLBAR_WIDTH , this.SCROLLBAR_WIDTH, false, 10, 6, 6)
	
	// Circle
	if (this.blueDot) drawBlueDot(this.context, this.width() - this.SCROLLBAR_WIDTH + (this.SCROLLBAR_WIDTH/2), this.height() - this.SCROLLBAR_WIDTH + (this.SCROLLBAR_WIDTH/2), (this.SCROLLBAR_WIDTH/3));

	// Horizontal Slider ---------------------------------------------------------------------------------------------------------------------------------------------------
	this.drawHSlider(this.slideH);
}

function drawBlueDot(context, left, top, radius) {
	var grad = context.createRadialGradient(left-10, top-10, 0, left + (radius * 3), top + (radius * 3), radius * 3.4);
	grad.addColorStop(0, "white"); grad.addColorStop(.25, HIGH_BLUE); grad.addColorStop(.5, DARK_BLUE); grad.addColorStop(1, DEEP_BLUE);
	
	context.fillStyle = grad;
	context.beginPath();
	context.arc(left, top, radius, 0, Math.PI*2, true);
	context.closePath();
	context.fill();
}

Grid.prototype.drawHSlider = function(left) 
{
	var width = this.SCROLL_SLIDER_LENGTH;
	var grad2 = this.context.createLinearGradient(0, this.height() - this.SCROLLBAR_WIDTH, 0, this.height());	
	this.drawSliderBox(grad2, left, this.height() - this.SCROLLBAR_WIDTH , width, this.SCROLLBAR_WIDTH - 1);

	// Slash marks
	this.context.strokeStyle = DEEP_BLUE; 
	this.context.beginPath(); 
	var mark = left + Math.floor(width / 2.7);
	for (var i = 0; i < 3; i++) {
		this.context.moveTo(mark+(3*i), this.height() - this.SCROLLBAR_WIDTH + 5); 
		this.context.lineTo(mark+(3*i), this.height() - this.SCROLLBAR_WIDTH + 12); 
		this.context.stroke();
	}
}

Grid.prototype.drawSliderBox = function(grad2, left, top, width, height) 
{
	var alpha = (this.inScroll)?.5:1;
	grad2.addColorStop(0, "rgba(246, 251, 255, " + alpha + ")"); grad2.addColorStop(.32, "rgba(229, 234, 238, " + alpha + ")"); grad2.addColorStop(.55, "rgba(197, 211, 228, " + alpha + ")"); grad2.addColorStop(1, "rgba(177, 191, 208, " + (alpha-.3) + ")");
	this.context.fillStyle = grad2; 
	this.context.fillRect(left, top, width, height);		// Vertical slider

	if (this.inScroll) {
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
		this.context.shadowBlur = 1;
		this.context.shadowColor = COTE_AZUR;
		this.context.strokeStyle = COTE_AZUR; 
		this.context.strokeRect(left, top, width-1, height-2);		// Vertical slider
		this.context.shadowOffsetX = 0;
		this.context.shadowOffsetY = 0;
	}  else {
		this.context.strokeStyle = DEEP_BLUE; 
		this.context.strokeRect(left, top, width, height);		// Vertical slider
	}
}

Grid.prototype.scrollTypesThatRepeat = function() // Those parts of the scrollbar which, if the mouse is kept down, will repeat the action
{ 
 return (this.inScroll == this.SCROLL_UP || this.inScroll == this.SCROLL_DOWN || this.inScroll == this.SCROLL_LEFT || this.inScroll == this.SCROLL_RIGHT || this.inScroll == this.VERTICAL_BAR || this.inScroll == this.HORIZONTAL_BAR);
}
