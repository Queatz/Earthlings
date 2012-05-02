var manager;

// http://stackoverflow.com/a/2117523/1296909
var server = '/a/' + 'xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});

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
