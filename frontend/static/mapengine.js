/*
	Handles fetching the correct data from the server.
	Handles updating data from the server live.
	Handles marker types.
*/
function MapEngine(obj, mkrs) {
	var _this = this;
	
	
	///////////////
	// Variables //
	///////////////
	
	this.obj = $(obj);
	this.markers = [];
	this.loadMarkersTimeout = null;
	this.reloadMarkers = mkrs;
	
	////////////////////
	// Initialization //
	////////////////////
	
	this._init = function() {
		var center = google.maps.LatLng(0, 0);
		var zoom = 0;
		
		// Center map where it last was
		var ll = $.cookie('earthlings_latlng');
		if(ll) {
			ll = ll.split('_');
			center = new google.maps.LatLng(parseFloat(ll[0]), parseFloat(ll[1]));
			zoom = parseInt(ll[2]);
		}
		
		// Create the Google Map
		this.obj.gmap3({
			options: {
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
						
						if(options.init)
							options.init(m);
					},
					events:{
						click: options.click,
						position_changed: function(m){
							if(options.position_changed)
								options.position_changed(m);
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
						draggable: options.draggable,
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
		var z = m.getMap().zoom > 16 ? Math.pow(2, m.getMap().zoom) / 4096 : 32;
		icon.size.height = z;
		icon.size.width = z;
		icon.scaledSize = icon.size;
		icon.anchor.x = icon.size.width / 2;
		icon.anchor.y = icon.size.height / 2;
	}
	
	////////////////////
	// Event Handlers //
	////////////////////
	
	// Labels are shown in the middle zoom levels
	this.getMapTypeFromZoom = function(z) {
		if(z < 17 && z > 5)
			return google.maps.MapTypeId.HYBRID;
		else
			return google.maps.MapTypeId.SATELLITE;
	}
	
	// Update marker sizes on zoom change and set the map type
	this._zoomChanged = function(m) {
		m.setMapTypeId(_this.getMapTypeFromZoom(m.zoom));
		
		for(i in _this.markers) {
			_this.updateMarkerZoom(_this.markers[i]);
		}
		
		_this._centerChanged(m);
	}
	
	// So the map stays where you last had it
	this._centerChanged = function(m) {
		$.cookie('earthlings_latlng', m.center.lat() + '_' + m.center.lng() + '_' + m.zoom, {expires: 365});
	}
	
	// Load markers
	this._boundsChanged = function(m) {
		if(this.loadMarkersTimeout)
			clearTimeout(this.loadMarkersTimeout);
		
		this.loadMarkersTimeout = setTimeout(function(){_this.reloadMarkers(m);}, 100);
	}
	
	// Run initialization
	this._init();
}
