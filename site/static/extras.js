String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

// TTimeout
// <http://stackoverflow.com/a/5227508/1296909>

function TTimeout(fn, interval, scope, args) {
	var self = this;

	this.id = null;
	this.active = false;
	this.interval = interval;
	this.scope = scope || window;
	this.args = args;
	
	
	this.trigger = function() {
		if(this.active)
			return;
		this.id = setTimeout(function(){
			self.clear();
			fn.apply(self.scope, self.args || arguments);
		}, self.interval);
		this.active = true;
	}

	this.clear = function() {
		clearTimeout(this.id);
		this.active = false;
		this.id = null;
	};
}

// Typical easing

function ease(a) {
	if(a < .5)
		return Math.pow(a * 2, 2) / 2;
	else
		return 0.5 + (0.5 - Math.pow(1 - (a - 0.5) * 2, 2) / 2);
}