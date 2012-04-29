var manager;

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
	manager = new Manager($('#map'));
	
	// Populate the menu
	addMenuItem('navigate');
	addMenuItem('handbook');
	
	// Populate the toolbar
	addTool('event');
	//addTool('camp');
	
	// Add tipsy tooltips
	$('[title]').tipsy({fade: true, gravity: 's', delayIn: 400, offset: 3});
});

///////////////////////////////////////////////////////

// Function to add a tool
function addTool(name) {
	var tool = $('<div>');
	tool.attr('title', name.capitalize());
	tool.addClass('tool');
	tool.css('backgroundImage', "url('resources/" + name + ".png')");
	$('#toolbar').append(tool);
	tool.click(function(){manager.map.addMarker(name == 'event' ? new Event() : null);});
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
