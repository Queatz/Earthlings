var map;

$(document).ready(function() {
	// Create the map div
	e = $('<div>');
	e.attr('id', 'map');
	$('body').append(e);
	
	// Create the toolbar div
	e = $('<div>');
	e.attr('id', 'toolbar');
	$('body').append(e);
	
	// Mechanics
	map = new MapEngine($('#map'));
	
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
	tool = $('<div>');
	tool.title = name.capitalize();
	$(tool).addClass('tool');
	$(tool).css('backgroundImage', "url('resources/" + name + ".png')");
	$('#toolbar').append(tool);
	$(tool).click(function(){map.addMarker(name == 'event' ? new Event() : null);});
}

// Menu boxes
boxmenu = function(e, n) {
	g = $('#' + n)
	if(g.css('display') != 'none')
		g.fadeOut(150);
	else
		g.fadeIn(150);
}

// Function to add a menu item
function addMenuItem(name) {
	tool = $('<div>');
	tool.title = name.capitalize();
	$(tool).addClass('menu');
	$(tool).css('backgroundImage', "url('resources/" + name + ".png')");
	$(tool).click(boxmenu[name]);
	$('#toolbar').append(tool);
}
