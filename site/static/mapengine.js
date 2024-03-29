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
		_this.mapEventsTimeout = setTimeout(_this.getEvents, 7000);
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
	this.mapEventsTimeout = setTimeout(_this.getEvents, 7000);
	this.shouldBeFunctionalTips = true;
	
	////////////////////
	// Initialization //
	////////////////////
	
	this._init = function() {
		var l = _this.cookieCZ();

		// Create the Google Map
		_this.obj.gmap3({
			options: {
				center: l[0],
				zoom: l[1],
				disableDefaultUI: true,
				mapTypeId: _this.getMapTypeFromZoom(l[1]),
				backgroundColor: '#222',
			},
			events: {
				zoom_changed: _this._zoomChanged,
				center_changed: _this._centerChanged,
				bounds_changed: _this._boundsChanged,
				dragstart: _this.ds,
				dragend: _this.de
			}
		});
		
		_this.mtips = new tooltipOverlay(_this.obj.gmap3('get'), _this.functionalTips);

		_this.findMe();
	}
	
	this.findMe = function() {
		navigator.geolocation.getCurrentPosition(_this.geoLocate, _this.fromCookie);
	}
	
	this.findLoc = function(l) {
		_this.obj.gmap3({
			action:'getAddress',
			address: l,
			callback: function(results){
				if(!results) return;
				_this.obj.gmap3('get').panTo(new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng()));
			}
		});
	};
	
	////////////
	// Useful //
	////////////
	
	this.functionalTips = function() {
		return _this.shouldBeFunctionalTips && _this.activeDrag == null;
	}
	
	// Try to get the last location + zoom from a cookie
	this.cookieCZ = function() {
		var center = new google.maps.LatLng(0, 0);
		var zoom = 2;
		
		// Center map where it last was
		var ll = $.cookie('earthlings_latlng');
		if(ll) {
			ll = ll.split('_');
			center = new google.maps.LatLng(parseFloat(ll[0]) || 0, parseFloat(ll[1]) || 0);
			zoom = parseInt(ll[2]) || 2;
		}

		return [center, zoom];
	}

	// Set location + zoom from cookie
	this.fromCookie = function(error) {
		var l = _this.cookieCZ();

		_this.obj.gmap3('get').setCenter(l[0]);
		_this.obj.gmap3('get').setZoom(l[1]);
	}
	

	// Set location + zoom from geolocation
	this.geoLocate = function(position) {
		_this.obj.gmap3('get').panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
		_this.obj.gmap3('get').setZoom(17);
	}

	// Get my bounds
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
	
	// Zoom me
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
		if(!mkr)
			return;
		
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
	
	// Remove a marker or by it's index in the markers array
	this.removeMarker = function(i) {
		var m;
		if(typeof i == 'number')
			m = _this.markers[i];
		else {
			m = i;
			i = _this.markers.indexOf(i);
		}
		
		_this.mtips.hideTip(m);
		m.setMap(null);
		_this.markers.splice(i, 1);
	}
	
	// Clear all markers
	this.clear = function() {
		var i = 0;
		while(i < _this.markers.length) {
			m = _this.markers[i];
			if(m.real.id) {
				_this.mtips.hideTip(m);
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
	
	this.ds = function(m) {
		_this.shouldBeFunctionalTips = false;
	}
	
	this.de = function(m) {
		_this.shouldBeFunctionalTips = true;
	}
	
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
		var scale = Math.pow(2, map.getZoom());
		var bounds = map.getBounds();
		var ne = bounds.getNorthEast();
		var sw = bounds.getSouthWest();
		var lat = (ne.lat() <= 0 && sw.lat() >= 0) || (ne.lat() >= 0 && sw.lat() <= 0) ? 0 : Math.min(Math.abs(ne.lat()), Math.abs(sw.lat())); // closest latitude to equator
		var deg1 = new google.maps.LatLng(lat, 0);
		var deg2 = new google.maps.LatLng(lat, 1);
		var coord1 = map.getProjection().fromLatLngToPoint(deg1);
		var coord2 = map.getProjection().fromLatLngToPoint(deg2);
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
