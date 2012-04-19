var map;

function reloadMarkers(m) {
	$.ajax(server, {
		type: 'POST',
		dataType: 'json', 
		data: {
			'rect': m.getBounds().toUrlValue()
		},
		success: function(x){
			map.clear();
			for(z in x) {
				y = x[z];
				map.addMarker(
					y[1] == 'event' ? new Event({
						id: y[0],
						mine: y[2],
						title: y[4][0],
						ends: y[4][1]
					}) : null,
					new google.maps.LatLng(y[3][0], y[3][1])
				);
			}
		}
	});
}

$(document).ready(function() {
	var e;
	// Create the map div
	e = $('<div>');
	e.attr('id', 'map');
	$('body').append(e);
	
	// Create the toolbar div
	e = $('<div>');
	e.attr('id', 'toolbar');
	$('body').append(e);
	
	// Mechanics
	map = new MapEngine($('#map'), reloadMarkers);
	
	// Populate the menu
	addMenuItem('navigate');
	addMenuItem('handbook');
	
	// Populate the toolbar
	addTool('event');
	//addTool('camp');
	
	// Add tipsy tooltips
	$('[title]').tipsy({fade: true, gravity: 's', delayIn: 1400, offset: 3});
});

///////////////////////////////////////////////////////

// Function to add a tool
function addTool(name) {
	var tool = $('<div>');
	tool.attr('title', name.capitalize());
	tool.addClass('tool');
	tool.css('backgroundImage', "url('resources/" + name + ".png')");
	$('#toolbar').append(tool);
	tool.click(function(){map.addMarker(name == 'event' ? new Event() : null);});
}

// Menu boxes
boxmenu = function(e, n) {
	var g = $('#' + n);
	if(g.css('display') != 'none')
		g.fadeOut(150);
	else
		g.fadeIn(150);
}

// Function to add a menu item
function addMenuItem(name) {
	var tool = $('<div>');
	tool.attr('title', name.capitalize());
	tool.addClass('menu');
	tool.css('backgroundImage', "url('resources/" + name + ".png')");
	tool.click(boxmenu[name]);
	$('#toolbar').append(tool);
}
