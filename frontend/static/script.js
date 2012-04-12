var map;

$(document).ready(function() {
	// Create the map div
	e = document.createElement('div');
	e.id = 'map';
	$('body').append(e);
	
	// Create the toolbar div
	e = document.createElement('div');
	e.id = 'toolbar';
	$('body').append(e);
	
	// Mechanics
	map = new MapEngine($('#map'));
	
	// Populate the menu
	addMenuItem('navigate');
	addMenuItem('handbook');
	
	// Populate the toolbar
	addTool('event');
	addTool('play');
	addTool('camp');
	
	// Add tipsy tooltips
	$('[title]').tipsy({fade: true, gravity: 's', delayIn: 1400, offset: 3});
});

// Default map marker options
markerdefdef = {
	image: '',
	title: '',
	edit: false,
	functional: false,
	tooltip: false,
	click: null
}

// Individual map marker options
markerdef = {
	'play': {image: 'play', functional: true},
	'event': {tooltip: true, image: 'event', edit: true, functional: true},
//	'treasure': {tooltip: true, image: 'treasure', edit: true, functional: true},
	'camp': {tooltip: true, title: 'Camp ', image: 'camp', edit: true, functional: true, click: null	},
//	'sparkle': {image: 'sparkle'}
}

// Function to add a tool
function addTool(name) {
	tool = document.createElement('div');
	tool.title = name.capitalize();
	$(tool).addClass('tool');
	$(tool).css('backgroundImage', "url('resources/" + name + ".png')");
	$('#toolbar').append(tool);
	$(tool).click(function(){map.addMarker($.extend({}, markerdefdef, markerdef[name]));});
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
	tool = document.createElement('div');
	tool.title = name.capitalize();
	$(tool).addClass('menu');
	$(tool).css('backgroundImage', "url('resources/" + name + ".png')");
	$(tool).click(boxmenu[name]);
	$('#toolbar').append(tool);
}
