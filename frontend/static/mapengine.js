/*
	Handles fetching the correct data from the server.
	Handles updating data from the server live.
	Handles marker types.
*/
function MapEngine(obj) {
	
	///////////////
	// Variables //
	///////////////
	
	_this = this;
	this.obj = $(obj);
	this.markers = [];
	
	////////////////////
	// Initialization //
	////////////////////
	
	this._init = function() {
		center = google.maps.LatLng(0, 0);
		zoom = 0;
		ll = $.cookie('earthlings_latlng');
		if(ll) {
			ll = ll.split('_');
			center = new google.maps.LatLng(parseFloat(ll[0]), parseFloat(ll[1]));
			zoom = parseInt(ll[2]);
		}
	
		this.obj.gmap3({
			options: {
				noClear: true,
				center: center,
				zoom: zoom,
				disableDefaultUI: true,
				mapTypeId: this.getMapTypeFromZoom(zoom),
				backgroundColor: '#222',
			},
			events: {
				zoom_changed: _this._zoomChanged,
				center_changed: _this._centerChanged,
				bounds_changed: _this._boundsChanged,
			}
		});
		
		this.mtips = new tooltipOverlay(this.obj.gmap3('get'));
	}
	
	//////////////////
	// Manipulation //
	//////////////////
	
	// Add a marker on the map
	// Options:
	// functional: bool // should match whether or not you can edit it (it's yours)
	// title: title
	// image: image name
	// tooltip: bool
	this.addMarker = function(options) {
		_this.obj.gmap3(
			{	action: 'addMarker',
				latLng: _this.obj.gmap3('get').getCenter(),
				marker: {
					callback: function(m){
						_this.updateMarkerZoom(m);
						_this.markers.push(m);
						
						m.save = function(n) {
							$(m.tip[0]).html(n);
							_this.mtips.updateTip(m.getPosition(), m.mtip);
							m.tipLocked = false;
							m.mtip = _this.mtips.showTip(m.getPosition(), _this.tip, m.mtip);
							_this.mtips.hideTip(m.mtip);
						}
						
						if(options.tooltip) {
							if(options.edit) {
								m.tip = $('<span><input type="text" /><input type="submit" value="Discard" /> <input type="submit" /></span>');
								$(m.tip[0].children[0]).val(options.title);
								m.tip[0].children[1].onclick = (function(e){_this.mtips.hideTip(m.mtip); _this.markers.splice(_this.markers.indexOf(m), 1); m.setMap(); m.tip[0].children[2].disabled = true;});
								m.tip[0].children[2].onclick = (function(e){m.save($(m.tip[0].children[0]).val())});
								m.tipLocked = true;
								setTimeout(function() {m.mtip = _this.mtips.showTip(m.getPosition(), m.tip); m.tip[0].children[0].focus();}, 600);
							}
							else {
								m.tipLocked = false;
								m.tip = options.title;
							}
						}
						else
							m.tipLocked = true;
					},
					events:{
						click: options.click,
						position_changed: function(m){
							_this.mtips.updateTip(m.getPosition(), m.mtip);
						},
						mouseover: function(m){
							if(!m.tipLocked)
								m.mtip = _this.mtips.showTip(m.getPosition(), _this.tip, m.mtip);
						},
						mouseout: function(m){
							if(!m.tipLocked)
								_this.mtips.hideTip(m.mtip);
						}
					},
					options:{
						draggable: options.functional,
						icon: new google.maps.MarkerImage(
							'resources/' + options.image + '.png',
							new google.maps.Size(),
							null,
							new google.maps.Point()
						),
						clickable: true,
						raiseOnDrag: false,
						animation: google.maps.Animation.DROP
					}
				}
			}
		);
	}
	
	// Do this so markers zoom with the map.
	this.updateMarkerZoom = function(m) {
		var icon = m.getIcon();
		z = m.getMap().zoom > 16 ? Math.pow(2, m.getMap().zoom) / 4096 : 16;
		icon.size.height = z;
		icon.size.width = z;
		icon.scaledSize = icon.size;
		icon.anchor.x = icon.size.width / 2;
		icon.anchor.y = icon.size.height / 2;
	}
	
	////////////////////
	// Event Handlers //
	////////////////////
	
	this.getMapTypeFromZoom = function(z) {
		if(z < 17 && z > 5)
			return google.maps.MapTypeId.HYBRID;
		else
			return google.maps.MapTypeId.SATELLITE;
	}
	
	this._zoomChanged = function(m) {
		m.setMapTypeId(_this.getMapTypeFromZoom(m.zoom));
		
		for(i in _this.markers) {
			_this.updateMarkerZoom(_this.markers[i]);
		}
		
		_this._centerChanged(m);
	}
	
	this._centerChanged = function(m) {
		$.cookie('earthlings_latlng', m.center.lat() + '_' + m.center.lng() + '_' + m.zoom, {expires: 365});
	}
	
	this._boundsChanged = function(m) {
		//console.log(m.getBounds().toUrlValue());
	}
	
	this._init();
}
