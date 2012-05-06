function Color(r, g, b) {
	var _this = this;
	
	_this.r = r;
	_this.g = g;
	_this.b = b;
	
	this.add = function(a) {
		return new Color(Math.max(0, Math.min(255, _this.r + a)), Math.max(0, Math.min(255, _this.g + a)), Math.max(0, Math.min(255, _this.b + a)));
	};
	
	this.get = function() {
		return 'rgb(' + parseInt(_this.r) + ', ' + parseInt(_this.g) + ', ' + parseInt(_this.b) + ')';
	};
}
	
function CimeObject(e) {
	var _this = this;
	
	this.timeout = null;
	this.old = 0;
	this.at = 0;
	this.target = 0;
	this.value = 0;
	this.element = e;
	this.text = null;

	this.draw = function() {
		var a = _this.value;

		if(a > 0.999)
			a = 1;

		var ctx = _this.element.getContext('2d');
		
		var w = ctx.canvas.width;
		var h = ctx.canvas.height;
		
		ctx.clearRect(0, 0, w, h);
		
		var r = Math.min(w, h) / 2 - 3;
		
		var x = w / 2, y = h / 2;
		
		ctx.beginPath();
		
		ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		var grd = ctx.createRadialGradient(x, y, 0, x, y, r);
		grd.addColorStop(0, '#111');
		grd.addColorStop(1, '#090909');
		ctx.fillStyle = grd;
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#333';
		ctx.stroke();

		ctx.beginPath();

		var color = new Color(255 * (1 - a), 255, 0);

		if(a > 0) {
			if(a < 1)
				ctx.moveTo(x, y);
			ctx.arc(x, y, r - 1.75, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * a, false);
			if(a < 1)
				ctx.lineTo(x, y);
			grd = ctx.createRadialGradient(x, 0, r / 4, x, y, r);
			grd.addColorStop(0, color.add(128).get());
			grd.addColorStop(0.3, color.get());
			grd.addColorStop(1, color.add(-128).get());
			ctx.fillStyle = grd;
			ctx.fill();
			ctx.lineWidth = 2;
			ctx.strokeStyle = color.add(-192).get();
			ctx.stroke();
		}
		
		if(_this.text) {
			ctx.fillStyle = 'white';
			ctx.font = x + 'px Berkshire Swash';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(_this.text, x, y);
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'black';
			ctx.strokeText(_this.text, x, y);
		}
	};

	this.update = function(v, instant) {
		if(typeof v != 'undefined') {
			if(typeof v == 'string') {
				_this.text = v;
				return;
			}

			_this.old = _this.value;
			_this.target = v;
			_this.at = 0;
		}

		_this.at += 0.02;

		if(_this.at >= 1 || instant) {
			_this.at = 0;
			_this.old = _this.target;
		}

		var e = ease(_this.at);
		_this.value = _this.old * (1 - e) + _this.target * e;

		_this.draw();

		if(_this.timeout || _this.value.toFixed(3) == _this.target.toFixed(3))
			return;

		_this.timeout = setTimeout(function() {_this.timeout = null; _this.update();}, 5);
	};
}

(function($) {
	$.fn.cime = function(v, instant) {
		return this.each(function() {
			if(typeof this._cime == 'undefined')
				this._cime = new CimeObject(this);
			
			this._cime.update(v, instant);
		});
	}
})(jQuery);
