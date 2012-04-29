// Default map marker options
function Marker() {
	this.image = '';
	this.title = '';
	this.draggable = true;
	this.id = null;
	
	// Function to call when clicked
	this.click = null;
	
	// Function to call after the marker was added to the map
	this.init = function(m){};
	
	// Function to call when the marker position changes
	this.position_changed = function(m){};
}

Event.prototype = new Marker();

function Event(options) {
	var _this = this;
	
	// Timeout to send new latlng when dragging a marker to a new position
	this.positionTimeout = null;
	
	if(options) {
		this.id = options.id;
	}
	else {
		this.id = null;
		this.draggable = true;
		this.image = 'event-mine';
	}
	
	// Handle updates from server
	this.handle = function(a) {
		switch(a[0]) {
			case 'latlng':
				_this.latlng = new google.maps.LatLng(a[1][0], a[1][1]);
				break;
			case 'mine':
				_this.image = a[1] ? 'event-mine' : 'event';
				_this.draggable = a[1];
				break;
			case 'title':
				_this.title = a[1];
				break;
			case 'ends':
				_this.ends = a[1];
				break;
			default:
				console.log(_this, 'Unknown handle: ', a);
		}
		
		// If we have enough information about the marker, then add it to the map.
		if(!_this.m) {
			if(_this.ends && _this.title && _this.latlng && _this.image)
				manager.map.addMarker(_this);
		}
	};
	
	// General init
	this.init = function(m){
		m.real = _this;
		_this.m = m;
		
		_this.m.mtip = null;
		
		m.save = function(n, e) {
			_this.title = n;
			_this.ends = e * 60 * 60;
			_this.solidify();
			manager.map.mtips.updateTip(_this.m.getPosition(), _this.m.mtip);
			_this.m.mtip = manager.map.mtips.showTip(m.getPosition(), _this.m, _this.m.mtip);
			manager.map.mtips.hideTip(_this.m.mtip);
			
			// Save to server
			$.ajax(server, {type: 'POST', dataType: 'json', data: {'add': 'event'}, success: function(x){
				_this.id = x;
				manager.registerPath(x, _this);
				$.ajax(server + '/' + x, {type: 'POST', dataType: 'json', data: {'edit': JSON.stringify({'title': n, 'ends': e})}});
				$.ajax(server + '/' + x, {type: 'POST', dataType: 'json', data: {'latlng': m.getPosition().toUrlValue()}});
			}});
		}
		
		m.tip = $('<span>');
		
		if(!options) {
			// Duration chooser
			var e_time = $('<div>').addClass('time').appendTo(m.tip);
			e_time.text(1);
			e_time[0].onclick = function(e) {
				i = parseFloat(e_time.text());
				e_time.text(isNaN(i) ? 1 : Math.min(12, i + 1));
			};
			
			// Subtract from duration
			var e_timeDOWN = $('<div>').addClass('timedown').appendTo(m.tip);
			e_timeDOWN.html('-');
			e_timeDOWN[0].onclick = function(e) {
				i = parseFloat(e_time.text());
				e_time.text(isNaN(i) ? 1 : Math.max(1, i - 1));
			};
			
			// Title
			var e_title = $('<input>').attr('type', 'text').attr('maxlength', '256').appendTo(m.tip);
			
			// Submit
			var e_submit = $('<input>').attr('type', 'submit').attr('value', 'Submit').appendTo(m.tip);
			e_submit[0].onclick = (function(e){m.save(e_title.val(), parseFloat(e_time.text()));});
			
			// Discard
			var e = $('<input>').attr('type', 'submit').attr('value', 'Discard').appendTo(m.tip);
			e[0].onclick = (function(e){manager.map.mtips.hideTip(m.mtip, 0); manager.map.markers.splice(manager.map.markers.indexOf(m), 1); m.setMap(); e_submit.attr('disabled', true);});
	
			m.tipLocked = true;
			setTimeout(function() {m.mtip = manager.map.mtips.showTip(m.getPosition(), m); e_title.focus();}, 600);
		}
		else {
			_this.solidify();
		}
	};
	
	// Regular tooltip
	this.solidify = function() {
		_this.m.tip.empty();
		// Duration chooser
		var e_time = $('<div>').addClass('time').appendTo(_this.m.tip);
		e_time.html(Math.round(_this.ends / 60 / 15 ) / 4, 2)
		if(_this.draggable) {
			e_time[0].onclick = function(e) {
				i = parseFloat(e_time.text());
				i = isNaN(i) ? 1 : Math.min(12, i + 0.25);
				e_time.text(i);
				$.ajax(server + '/' + _this.id, {type: 'POST', dataType: 'json', data: {'edit': JSON.stringify({'ends': i})}});
			};
		}
		
		$('<br>').appendTo(_this.m.tip);
		
		$(_this.m.tip).append(_this.title);
		
		_this.m.tipLocked = false;
	}
	
	// Save changes to the location
	this.position_changed = function(m){
		if(!_this.id || !(manager.map.activeDrag == m)) return;
		
		if(_this.positionTimeout)
			clearTimeout(_this.positionTimeout);
		
		_this.positionTimeout = setTimeout(function(){
			$.ajax(server + '/' + _this.id, {
				type: 'POST', dataType: 'json',
				data: {'latlng': m.getPosition().toUrlValue()}
			});
		}, 100);
	};
	
}
