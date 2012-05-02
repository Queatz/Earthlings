// Default map marker options
function Marker() {
	var _this = this;

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
		this.image = 'resources/event-mine.png';
	}
	
	// Slide markers when moving
	this.setPositionTimeout = null;
	this.setPositionFrom = null;
	this.setPositionFactor = null;

	this.setPosition = function(dest) {
		if(dest) {
			_this.setPositionFrom = _this.m.getPosition();
			_this.setPositionFactor = 0;
		}

		if(_this.setPositionTimeout)
			clearTimeout(_this.setPositionTimeout);

		_this.setPositionFactor += 0.02;

		var a;
		if(_this.setPositionFactor < .5)
			a = Math.pow(_this.setPositionFactor * 2, 2) / 2;
		else
			a = 0.5 + (0.5 - Math.pow(1 - (_this.setPositionFactor - 0.5) * 2, 2) / 2);

		_this.m.setPosition(new google.maps.LatLng(
			_this.setPositionFrom.lat() * (1 - a) + a * _this.latlng.lat(),
			_this.setPositionFrom.lng() * (1 - a) + a * _this.latlng.lng()
			));


		if(_this.setPositionFactor < 1)
			_this.setPositionTimeout = setTimeout(_this.setPosition, 5);
		else
			_this.setPositionTimeout = null;
	}

	// Handle updates from server
	this.handle = function(a) {
		switch(a[0]) {
			case 'latlng':
				_this.latlng = new google.maps.LatLng(a[1][0], a[1][1]);
				
				if(_this.m)
					_this.setPosition(_this.latlng);
				
				break;
			case 'mine':
				_this.image = 'resources/' + (a[1] ? 'event-mine' : 'event') + '.png';
				_this.draggable = a[1];
				
				if(_this.m && manager.map.activeDrag != _this.m) {
					var i = _this.m.getIcon();
					i.url = _this.image;
					_this.m.setIcon(i);
				}
				
				break;
			case 'title':
				_this.title = a[1];
				
				if(_this.elm_title)
					_this.elm_title.html(_this.title);
				
				break;
			case 'ends':
				_this.ends = new Date();
				_this.ends.setTime(_this.ends.getTime() + a[1] * 1000);
				
				break;
			default:
				break;
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
			_this.ends = e;
			_this.solidify();
			manager.map.mtips.updateTip(_this.m);
			_this.m.mtip = manager.map.mtips.showTip(_this.m);
			manager.map.mtips.hideTip(_this.m);
			
			// Save to server
			$.ajax(server, {type: 'POST', dataType: 'json', data: {'add': 'event'}, success: function(x){
				_this.id = x;
				manager.registerPath(x, _this);
				$.ajax(server + '/' + x, {type: 'POST', dataType: 'json', data: {'edit': JSON.stringify({'title': n, 'ends': _this.sendEnds()})}});
				$.ajax(server + '/' + x, {type: 'POST', dataType: 'json', data: {'latlng': m.getPosition().toUrlValue()}});
			}});
		}
		
		m.tip = $('<span>');
		
		if(!options) {
			// Duration chooser
			var e_time = $('<canvas>').attr('width', 100).attr('height', 100).addClass('time').appendTo(m.tip).cime(1, 1);
			
			_this.ends = new Date();
			_this.ends.setTime(_this.ends.getTime() + 60 * 60 * 1000);
			
			_this.elm_ends = e_time;
			
			e_time[0].onclick = function(e) {
				_this.ends.setTime(_this.ends.getTime() + 15 * 60 * 1000);
				
				_this.updateTime();
			};
			
			// Subtract from duration
			var e_timeDOWN = $('<div>').addClass('timedown').appendTo(m.tip);
			e_timeDOWN.html('-');
			e_timeDOWN[0].onclick = function(e) {
				var now = new Date();
				_this.ends.setTime(_this.ends.getTime() - 15 * 60 * 1000);
				
				_this.updateTime();
			};
			
			// Title
			var e_title = $('<input>').attr('type', 'text').attr('maxlength', '256').appendTo(m.tip);
			
			// Submit
			var e_submit = $('<input>').attr('type', 'submit').attr('value', 'Submit').appendTo(m.tip);
			e_submit[0].onclick = (function(e){m.save(e_title.val(), _this.ends);});
			
			// Discard
			var e = $('<input>').attr('type', 'submit').attr('value', 'Discard').appendTo(m.tip);
			e[0].onclick = (function(e){manager.map.mtips.hideTip(m, 0); manager.map.markers.splice(manager.map.markers.indexOf(m), 1); m.setMap(); e_submit.attr('disabled', true);});
	
			m.tipLocked = true;
			setTimeout(function() {m.mtip = manager.map.mtips.showTip(m); e_title.focus();}, 600);
		}
		else {
			_this.solidify();
		}
	};
	
	this.sendEnds = function() {
		return (_this.ends.getTime() - new Date().getTime()) / 1000 / 60 / 60;
	};
	
	// Regular tooltip
	this.solidify = function() {
		_this.m.tip.empty();
		
		// Duration chooser
		_this.elm_ends = $('<canvas>').attr('width', 100).attr('height', 100).addClass('time').appendTo(_this.m.tip);
		
		if(_this.draggable) {
			_this.elm_ends[0].onclick = function(e) {
				var now = new Date();
				_this.ends.setTime(Math.min(_this.ends.getTime() + 15 * 60 * 1000, now.getTime() + 11.999 * 60 * 60 * 1000));
				_this.updateTime();
				$.ajax(server + '/' + _this.id, {type: 'POST', dataType: 'json', data: {'edit': JSON.stringify({'ends': _this.sendEnds()})}});
			};
		}
		
		$('<br>').appendTo(_this.m.tip);
		
		$(_this.m.tip).append(_this.title);
		
		_this.m.tipLocked = false;
		
		_this.m.tipHideCallback = function(m) {
			if(_this.updateTimeCallback)
				clearTimeout(_this.updateTimeCallback);
			_this.updateTimeCallback = null;
		};
		
		_this.m.tipShowCallback = function(m) {
			if(_this.updateTimeCallback)
				return
			
			_this.doUpdateTime();
		};
	}
	
	// Time
	
	this.doUpdateTime = function() {
		_this.updateTime();
		_this.updateTimeCallback = setTimeout(_this.doUpdateTime, 500);
	};
	
	this.updateTime = function() {
		var now = new Date();
		var remain = (_this.ends.getTime() - now.getTime()) / 1000 / 60 / 60;
		_this.elm_ends.cime(remain % 1, Math.ceil(remain));
	};
	
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
