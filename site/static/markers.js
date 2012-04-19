
// Default map marker options
function Marker() {
	this.image = '';
	this.title = '';
	this.click = null;
	this.draggable = true;
	
	this.init = function(m){};
	this.position_changed = function(m){};
}

Event.prototype = new Marker();

function Event(options) {
	var _this = this;
	
	this.image = 'event';
	this.positionTimeout = null;
	
	if(options) {
		this.id = options.id;
		this.draggable = options.mine;
		this.title = options.title;
		this.ends = options.ends / 60 / 60;
	}
	else {
		this.id = null;
		this.draggable = true;
	}
	
	this.init = function(m){
		m.real = _this;
		_this.m = m;
		
		m.save = function(n, e) {
			map.mtips.hideTip(m.mtip, 0);
			_this.title = n;
			_this.ends = e;
			_this.solidify();
			map.mtips.updateTip(m.getPosition(), m.mtip);
			m.mtip = map.mtips.showTip(m.getPosition(), m.tip, m.mtip);
			map.mtips.hideTip(m.mtip);
			
			// Save to server
			$.ajax(server, {type: 'POST', dataType: 'json', data: {'add': 'event'}, success: function(x){
				_this.id = x;
				$.ajax(server + '/' + x, {type: 'POST', dataType: 'json', data: {'edit': JSON.stringify({'title': n, 'ends': e})}});
				$.ajax(server + '/' + x, {type: 'POST', dataType: 'json', data: {'latlng': m.getPosition().toUrlValue()}});
			}});
		}
		
		m.tip = $('<span>');
		
		if(!options) {
			// Duration chooser
			var e_time = $('<div>').addClass('time').appendTo(m.tip);
			e_time.text(1)
			e_time[0].onclick = function(e) {
				i = parseInt(e_time.text());
				e_time.text(isNaN(i) ? 1 : Math.min(12, i + 1));
			};
			
			// Subtract from duration
			var e_timeDOWN = $('<div>').addClass('timedown').appendTo(m.tip);
			e_timeDOWN.html('-');
			e_timeDOWN[0].onclick = function(e) {
				i = parseInt(e_time.text());
				e_time.text(isNaN(i) ? 1 : Math.max(1, i - 1));
			};
			
			// Title
			var e_title = $('<input>').attr('type', 'text').appendTo(m.tip);
	
			// Submit
			var e_submit = $('<input>').attr('type', 'submit').attr('value', 'Submit').appendTo(m.tip);
			e_submit[0].onclick = (function(e){m.save(e_title.val(), parseInt(e_time.text()));});
	
			// Discard
			var e = $('<input>').attr('type', 'submit').attr('value', 'Discard').appendTo(m.tip);
			e[0].onclick = (function(e){map.mtips.hideTip(m.mtip, 0); map.markers.splice(map.markers.indexOf(m), 1); m.setMap(); e_submit.attr('disabled', true);});
	
			m.tipLocked = true;
			setTimeout(function() {m.mtip = map.mtips.showTip(m.getPosition(), m.tip); e_title.focus();}, 600);
		}
		else {
			_this.solidify();
		}
	};
	
	this.solidify = function() {
		_this.m.tip.empty();
		// Duration chooser
		var e_time = $('<div>').addClass('time').appendTo(_this.m.tip);
		e_time.html(Math.round(_this.ends))
		if(_this.draggable) {
			e_time[0].onclick = function(e) {
				i = parseInt(e_time.text());
				e_time.text(isNaN(i) ? 1 : Math.min(12, i + 1));
			};
		}
		
		$('<br>').appendTo(_this.m.tip);
		
		$(_this.m.tip).append(this.title);
		
		_this.m.tipLocked = false;
		_this.m.mtip = null;
	}
	
	this.position_changed = function(m){
		if(!this.id) return;
		
		if(this.positionTimeout)
			clearTimeout(this.positionTimeout);
		
		this.positionTimeout = setTimeout(function(){
			$.ajax(server + '/' + _this.id, {
				type: 'POST', dataType: 'json',
				data: {'latlng': m.getPosition().toUrlValue()}, success: function(x){
					console.log(x);
				}
			});
		}, 100);
	};
	
}