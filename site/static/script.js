var manager;

// http://stackoverflow.com/a/2117523/1296909
var server = '/a/' + 'xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});

$(document).ready(function() {
	var e, b;
	// Create the map div
	e = $('<div>');
	e.attr('id', 'map');
	$('body').append(e);
	
	// Create the toolbar div
	e = $('<div>');
	e.attr('id', 'toolbar');
	$('body').append(e);
	
	// Mechanics
	manager = new Manager($('#map'));
	
	// Menu
	
	e = $('<div>').attr('id', 'navigate').addClass('navigate').appendTo($('body'));
	b = $('<input>').attr('type', 'submit').attr('value', 'Find Me').appendTo(e).click(function(e) {
		$('#navigate').slideUp(120);
		manager.map.findMe();
	});
	b = $('<input>').attr('type', 'text').appendTo(e);
	b.autocomplete({
		delay: 1000,
		source: function() {
			manager.map.obj.gmap3({
				action:'getAddress',
				address: b.val(),
				callback:function(results){
					if(!results || results.length == 1) return;
					else b.autocomplete('display', results, false);
				}
			});
		},
		cb: {
			cast: function(item){
				return item.formatted_address;
			},
			select: function(item) {
				manager.map.obj.gmap3('get').panTo(new google.maps.LatLng(item.geometry.location.lat(), item.geometry.location.lng()));
			}
		}
	}).keyup(function(e) {
		if(e.keyCode == 13)
			manager.map.findLoc(this.value);
	});
	
	// Populate the menu
	addMenuItem('navigate');
	
	// Populate the toolbar
	addTool('event');
	//addTool('camp');
	
	// Add tipsy tooltips
	$('[title]').tipsy({fade: true, gravity: 's', delayIn: 400, offset: 3});
	
	$(document).keydown(function(e){
		switch(e.keyCode) {
			case 33:
				manager.map.zoom(1);
				break;
			case 34:
				manager.map.zoom(-1);
				break;
		}
	});
});

///////////////////////////////////////////////////////

// Function to add a tool
function addTool(name) {
	var tool = $('<div>');
	tool.addClass('tool');
	tool.css('backgroundImage', "url('resources/" + name + ".png')");
	$('#toolbar').append(tool);
	tool.click(function(){manager.map.addMarker(name == 'event' ? new Event() : null);});
}

// Menu boxes
boxmenu = function(n) {
	var g = $('#' + n);
	if(g.css('display') == 'none') {
		g.slideDown(120);
		g.find('input[type=text]').focus();
	}
	else
		g.slideUp(120);
}

// Function to add a menu item
function addMenuItem(name) {
	var tool = $('<div>');
	tool.addClass('menu');
	tool.css('backgroundImage', "url('resources/" + name + ".png')");
	$('#toolbar').append(tool);
	tool.click(function() {boxmenu(name);});
}
