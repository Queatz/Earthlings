
// Default map marker options
function Marker() {
	this.image = '';
	this.title = '';
	this.click = null;
	this.draggable = true;
	
	this.init = function(m){};
}

Event.prototype = Marker;

function Event(options) {
	this.image = 'event';
	
	this.init = function(m){
		_this = map;
		
		m.save = function(n) {
			$(m.tip[0]).html(n);
			_this.mtips.updateTip(m.getPosition(), m.mtip);
			m.tipLocked = false;
			m.mtip = _this.mtips.showTip(m.getPosition(), _this.tip, m.mtip);
			_this.mtips.hideTip(m.mtip);
			
			// Save to server
			$.ajax(server, {data: {'add': 'event'}, complete: function(x, t){
				$.ajax(server + '/' + t, {data: {'latlng': m.getPosition().toUrlValue()}});
				$.ajax(server + '/' + t, {data: {'edit': n}});
			}});
		}
		
		m.tip = $('<span>');
	
		// Duration chooser
		e_time = $('<div>').addClass('time').appendTo(m.tip);
		e_time.text(1)
		e_time[0].onclick = function(e) {
			i = parseInt(e_time.text());
			e_time.text(isNaN(i) ? 1 : Math.min(12, i + 1));
		};
		
		// Subtract from duration
		e_timeDOWN = $('<div>').addClass('timedown').appendTo(m.tip);
		e_timeDOWN.html('-');
		e_timeDOWN[0].onclick = function(e) {
			i = parseInt(e_time.text());
			e_time.text(isNaN(i) ? 1 : Math.max(1, i - 1));
		};
	
		// Title
		e_title = $('<input>').attr('type', 'text').appendTo(m.tip);
	
		// Submit
		e_submit = $('<input>').attr('type', 'submit').attr('value', 'Submit').appendTo(m.tip);
		e_submit[0].onclick = (function(e){m.save(e_title.val());});
	
		// Discard
		e = $('<input>').attr('type', 'submit').attr('value', 'Discard').appendTo(m.tip);
		e[0].onclick = (function(e){_this.mtips.hideTip(m.mtip, 0); _this.markers.splice(_this.markers.indexOf(m), 1); m.setMap(); e_submit.attr('disabled', true);});
	
		m.tipLocked = true;
		setTimeout(function() {m.mtip = _this.mtips.showTip(m.getPosition(), m.tip); e_title.focus();}, 600);
	};
	
}
