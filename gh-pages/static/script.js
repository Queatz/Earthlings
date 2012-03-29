var map;

$(document).ready(function() {
	// Map
	e = document.createElement('div');
	e.id = 'map';
	$('body').append(e);
	
	// Toolbar
	e = document.createElement('div');
	e.id = 'toolbar';
	$('body').append(e);
	
	//Mechanics
	map = new MapEngine($('#map'));
	
	//Menu
	addMenuItem('navigate');
//	addMenuItem('language');
//	addMenuItem('grateful');
	addMenuItem('handbook');
	
	// Toolbar
	addTool('play');
	addTool('event');
//	addTool('treasure');
	addTool('camp');
//	addTool('sparkle');
	$('[title]').tipsy({fade: true, gravity: 's', delayIn: 1400, offset: 3});
});

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

// Default map marker options
markerdefdef = {
	image: '',
	title: '',
	edit: false,
	functional: false,
	tooltip: false
}

// Individual map marker options
markerdef = {
	'play': {image: 'play'},
	'event': {tooltip: true, image: 'event', edit: true, functional: true},
//	'treasure': {tooltip: true, image: 'treasure', edit: true, functional: true},
	'camp': {tooltip: true, title: 'Camp ', image: 'camp', edit: true, functional: true},
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
