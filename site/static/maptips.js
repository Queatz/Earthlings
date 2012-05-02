// Tooltips for Google Maps v3

// Tooltips are done in an overlay
tooltipOverlay.prototype = new google.maps.OverlayView();

function tooltipOverlay(map) {
	// Set the map of the tooltip overlay
	this.setMap(map);
}

tooltipOverlay.prototype.onAdd = function() {
	// A list of all markers tooltips divs
	this.waiting = [];
}

// Update tooltip location
tooltipOverlay.prototype.updateTip = function(m) {
	if(!m || !m.mdiv) return;
	for(d in this.waiting) {
		if(this.waiting[d] == m) {
			var px = this.getProjection().fromLatLngToDivPixel(m.getPosition());
			this.waiting[d].mdiv.css({
				top: px.y - 8,
				left: px.x - 100,
			});
		}
	}
}

// Show a tooltip
tooltipOverlay.prototype.showTip = function(m) {
	if(!m) return;
	
	var _this = this;
	
	if(!m.mdiv) {
		m.mdiv = $('<div>');
		
		m.mdiv[0].held = false;
		
		m.mdiv.on('mouseover', function(e) {
			if(m.tipLocked) return;
			
			if(m.mdiv[0].timeout) {
				clearTimeout(m.mdiv[0].timeout);
				m.mdiv[0].timeout = null;
			}
			
			m.mdiv[0].held = true;
		});
		
		m.mdiv.on('mouseout', function(e) {
			if(m.tipLocked) return;
			
			m.mdiv[0].held = false;
			_this.hideTip(m);
		});
	
		this.getPanes().floatPane.appendChild(m.mdiv[0]);
	
		m.mdiv.css({
			position: 'absolute',
			width: 200,
			height: 0,
			zIndex: 1999,
			cursor: 'default'
		});
	
		this.waiting.push(m);
		this.updateTip(m);
		
		m.mdiv.tipsy({
			opacity: 0.95,
			fadeTime: 'fast',
			trigger: 'manual',
			gravity: 's',
			fade: true,
			html: true,
			title: function(){return m.tip;},
			insertTo: m.mdiv[0]
		});
		
		// Make tooltips interactable
		var sP = function(e){e.stopPropagation();}
		m.mdiv.mousedown(sP);
		m.mdiv.click(sP);
		m.mdiv.dblclick(sP);
	}
	
	// If the tip is stil open
	// then just cancel any close timeout
	if(m.mdiv[0].timeout) {
		clearTimeout(m.mdiv[0].timeout);
		m.mdiv[0].timeout = null;
	}
	else {
		if(m.tipShowCallback)
			m.tipShowCallback(m);
		m.mdiv.tipsy('show');
	}
}

// Hide a tooltip
tooltipOverlay.prototype.hideTip = function(m, t) {
	if(!m || !m.mdiv) return;
	if(typeof t == 'undefined') t = 0;
	m.mdiv[0].timeout = setTimeout(function(){
		if(m.tipHideCallback)
			m.tipHideCallback(m);
		m.mdiv.tipsy('hide');
		m.mdiv[0].timeout = undefined;
	}, t);
}

// Draw tooltips
tooltipOverlay.prototype.draw = function() {
	for(var d in this.waiting)
		this.updateTip(this.waiting[d]);
}
