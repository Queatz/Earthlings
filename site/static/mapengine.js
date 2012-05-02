/*
	Handles fetching the correct data from the server.
	Handles updating data from the server live.
	Handles marker types.
*/
function MapEngine(obj, manager) {
	var _this = this;
	
	////////////
	// Events //
	////////////
	
	this.getEvents = function() {
		_this.mapEventsTimeout = setTimeout(_this.getEvents, 3000);
		_this.mapEvents(_this);
	};
	
	///////////////
	// Variables //
	///////////////
	
	this.obj = $(obj);
	this.markers = [];
	this.reloadMarkers = manager.reload;
	this.mapEvents = manager.events;
	this.loadMarkersTimeout = new TTimeout(function(){_this.reloadMarkers(_this);}, 250);
	this.mapEventsTimeout = setTimeout(_this.getEvents, 3000);
	
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
		_this.obj.gmap3({
			options: {
				center: center,
				zoom: zoom,
				disableDefaultUI: true,
				mapTypeId: _this.getMapTypeFromZoom(zoom),
				backgroundColor: '#222',
			},
			events: {
				zoom_changed: _this._zoomChanged,
				center_changed: _this._centerChanged,
				bounds_changed: _this._boundsChanged,
			}
		});
		
		_this.mtips = new tooltipOverlay(_this.obj.gmap3('get'));
	}
	
	////////////
	// Useful //
	////////////
	
	this.bounds = function() {
		var b = _this.obj.gmap3('get').getBounds();
	
		if (_this.isFullLng())
			b = new google.maps.LatLngBounds(
				new google.maps.LatLng(b.getSouthWest().lat(), -179.99),
				new google.maps.LatLng(b.getNorthEast().lat(), 179.99)
			);
	
		return b;
	}
	
	//////////////////
	// Manipulation //
	//////////////////
	
	this.zoom = function(z) {
		var m = _this.obj.gmap3('get');
		m.setZoom(m.getZoom() + z);
	};
	
	// Add a marker on the map
	// Options:
	// functional: bool // should match whether or not you can edit it (it's yours)
	// title: title
	// image: image name
	// tooltip: bool
	this.addMarker = function(mkr) {
		_this.obj.gmap3(
			{	action: 'addMarker',
				latLng: mkr.latlng || _this.obj.gmap3('get').getCenter(),
				marker: {
					callback: function(m){
						_this.updateMarkerZoom(m);
						_this.markers.push(m);
						
						if(mkr.init)
							mkr.init(m);
					},
					events:{
						click: mkr.click,
						position_changed: function(m){
							if(mkr.position_changed)
								mkr.position_changed(m);
							_this.mtips.updateTip(m);
						},
						mouseover: function(m){
							if(!m.tipLocked)
								m.mtip = _this.mtips.showTip(m);
						},
						mouseout: function(m){
							if(!m.tipLocked)
								_this.mtips.hideTip(m);
						},
						dragstart: _this.dragstart,
						dragend: _this.dragend
					},
					options:{
						optimized: false, // So markers scale.
						draggable: mkr.draggable,
						icon: new google.maps.MarkerImage(
							mkr.image,
							new google.maps.Size(),
							null,
							new google.maps.Point()
						),
						clickable: true,
						raiseOnDrag: false,
						animation: mkr.latlng ? null : google.maps.Animation.DROP
					}
				}
			}
		);
	}
	
	// Remove a marker by it's index in the markers array
	this.removeMarker = function(i) {
		var m = _this.markers[i];
		_this.mtips.hideTip(m.mtip);
		m.setMap(null);
		_this.markers.splice(i, 1);
	}
	
	// Clear all markers
	this.clear = function() {
		var i = 0;
		while(i < _this.markers.length) {
			m = _this.markers[i];
			if(m.real.id) {
				_this.mtips.hideTip(m.mtip);
				m.setMap(null);
				_this.markers.splice(i, 1);
			}
			else
				i++;
		}
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
	
	this.dragstart = function(m) {
		_this.activeDrag = m;
	}
	
	this.dragend = function(m) {
		_this.activeDrag = null;
	}
	
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
		
		for(i in _this.markers)
			_this.updateMarkerZoom(_this.markers[i]);
		
		_this._centerChanged(m);
	}
	
	// So the map stays where you last had it
	this._centerChanged = function(m) {
		if(m.center.lat() > 85) m.setCenter(new google.maps.LatLng(85, m.center.lng()));
		if(m.center.lat() < -85) m.setCenter(new google.maps.LatLng(-85, m.center.lng()));
		
		$.cookie('earthlings_latlng', m.center.lat() + '_' + m.center.lng() + '_' + m.zoom, {expires: 365});
	}
	
	this.isFullLng = function() {
		var map = _this.obj.gmap3('get');
		var scale = Math.pow(2, map.getZoom()),
		bounds = map.getBounds(),
		ne = bounds.getNorthEast(),
		sw = bounds.getSouthWest(),
		lat = (ne.lat() <= 0 && sw.lat() >= 0) || (ne.lat() >= 0 && sw.lat() <= 0) ? 0 : Math.min(Math.abs(ne.lat()), Math.abs(sw.lat())), // closest latitude to equator
		deg1 = new google.maps.LatLng(lat, 0),
		deg2 = new google.maps.LatLng(lat, 1),
		coord1 = map.getProjection().fromLatLngToPoint(deg1),
		coord2 = map.getProjection().fromLatLngToPoint(deg2);
		// distance for one long degree in pixels for this zoom level
		var pixelsPerLonDegree = (coord2.x - coord1.x) * scale;
		// width of map's holder should be <= 360 (deg) * pixelsPerLonDegree if full map is displayed
		var width = _this.obj.width(); // width of map's holder div
		return pixelsPerLonDegree * 360 <= width;
	}
	
	// Load markers
	this._boundsChanged = function(m) {
		_this.loadMarkersTimeout.trigger();
	}
	
	// Run initialization
	this._init();
}
