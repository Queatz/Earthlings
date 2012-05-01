(function($) {
	$.fn.cime = function(a, t) {
		return this.each(function() {
			ctx = this.getContext('2d');
			
			var w = ctx.canvas.width;
			var h = ctx.canvas.height;
			
			ctx.clearRect(0, 0, w, h);
			
			if(a <= 0)
				return;
			
			var r = Math.min(w, h) / 2 - 3;
			
			var x = w / 2, y = h / 2;
			
			ctx.beginPath();
			
			if(a < 0.99)
				ctx.moveTo(x, y);
			ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * a, false);
			if(a < 0.99)
				ctx.lineTo(x, y);
			grd = ctx.createRadialGradient(x, 0, 0, x, y, r);
			grd.addColorStop(0, 'lime');
			grd.addColorStop(1, 'green');
			ctx.fillStyle = grd;
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'darkgreen';
			ctx.stroke();
			
			if(t > 0) {
				ctx.fillStyle = 'white';
				ctx.font = x + 'px Berkshire Swash';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(t, x, y);
				ctx.lineWidth = 2;
				ctx.strokeStyle = 'black';
				ctx.strokeText(t, x, y);
			}
		});
	}
})(jQuery);
