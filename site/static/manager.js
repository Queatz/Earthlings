// Handle all incoming messages
function Manager(mapdiv) {
	var _this = this;
	
	this._init = function() {
		this.map = new MapEngine(mapdiv, this);
		this._paths = [];
	};
	
	// Handle path ''
	this.handle = function(a) {
		if(a[0] == 'add') {
			var x = a[1];
		
			if(!(x[0] in _this._paths)) {
				if(x[1] == 'event')
				_this._paths[x[0]] = new Event({id: x[0]});
			}
			
			if(x[2])
				for(xx in x[2])
					_this._paths[x[0]].handle(x[2][xx]);
		}
	};
	
	this.process = function(x) {
		for(var z in x) {
			var y = x[z];
			
			if(!y[0])
				for(var zz in y[1])
					_this.handle(y[1][zz]);
			else if(y[0] in _this._paths)
				for(var zz in y[1])
					_this._paths[y[0]].handle(y[1][zz]);
		}
	};
	
	this.reload = function(m) {
		b = _this.map.bounds();
		
		$.ajax(server, {
			type: 'POST',
			dataType: 'json', 
			data: {
				'rect': b.toUrlValue()
			},
			success: function(x) {
				// Clear all markers out of bounds
				var i = 0;
				while(i < _this.map.markers.length) {
					var m = _this.map.markers[i];
					if(m.real.id && !b.contains(m.getPosition())) {
						delete _this._paths[m.real.id];
						_this.map.removeMarker(i);
						continue;
					}
					i++;
				}
			
				_this.process(x);
			}
		});
	};

	this.events = function(m) {
		b = _this.map.bounds();
	
		$.ajax(server, {
			type: 'POST',
			dataType: 'json', 
			data: {
				'events': true
			},
			success: function(x){
				_this.process(x);
			}
		});
	};
	
	this.registerPath = function(p, h) {
		_this._paths[p] = h;
	};
	
	this._init();
}
