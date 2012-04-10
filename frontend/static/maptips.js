// Tooltips for Google Maps v3

tooltipOverlay.prototype = new google.maps.OverlayView();

function tooltipOverlay(map) {
	this.setMap(map);
}

tooltipOverlay.prototype.onAdd = function() {
	this.waiting = [];
}

tooltipOverlay.prototype.updateTip = function(latLon, div) {
	if(!div) return;
	for(d in this.waiting) {
		if(this.waiting[d][0][0] == div[0]) {
			this.waiting[d][1] = latLon;
			
			px = this.getProjection().fromLatLngToDivPixel(this.waiting[d][1]);
			this.waiting[d][0].css({
				top: px.y - 8,
				left: px.x - 100,
			});
		}
	}
}

tooltipOverlay.prototype.showTip = function(latLon, tip, div) {
	if(!div) {
		div = $('<div>');
	
		this.getPanes().floatPane.appendChild(div[0]);
	
		div.css({
			position: 'absolute',
			width: 200,
			height: 0,
			zIndex: 1999,
			cursor: 'default'
		});
	
		this.waiting.push([div, latLon]);
		this.updateTip(latLon, div);
		
		div.tipsy({
			delayOut: 500,
			trigger: 'manual',
			gravity: 's',
			fade: true,
			html: true,
			title: function(){return div.tipHTML;},
			insertTo: div
		});
		
		// Make tooltips interactable
		sP = function(e){e.stopPropagation();}
		div.mousedown(sP);
		div.click(sP);
		div.dblclick(sP);
	}
	
	if(typeof tip != 'undefined')
		div.tipHTML = tip;
	
	if(div[0].timeout) {
		clearTimeout(div[0].timeout);
		div[0].timeout = null;
	}
	else {
		div.tipsy('show');
	}
	
	return div;
}

tooltipOverlay.prototype.hideTip = function(div, t) {
	if(typeof t == 'undefined') t = 500;
	div[0].timeout = setTimeout(function(){div.tipsy('hide'); div[0].timeout = undefined;}, t);
}

tooltipOverlay.prototype.draw = function() {
	for(d in this.waiting)
		this.updateTip(this.waiting[d][1], this.waiting[d][0]);
}
