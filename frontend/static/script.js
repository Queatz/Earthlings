var map;

$(document).ready(function() {
	// Create the map div
	e = $('<div>');
	e.id = 'map';
	$('body').append(e);
	
	// Create the toolbar div
	e = $('<div>');
	e.id = 'toolbar';
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

function eventInit(m) {
	m.save = function(n) {
		$(m.tip[0]).html(n);
		_this.mtips.updateTip(m.getPosition(), m.mtip);
		m.tipLocked = false;
		m.mtip = _this.mtips.showTip(m.getPosition(), _this.tip, m.mtip);
		_this.mtips.hideTip(m.mtip);
	}
	
	m.tip = $('<span><div class="time"></div><input type="text" /><input type="submit" value="Discard" /> <input type="submit" /></span>');
	m.tip[0].children[1].onclick = (function(e){_this.mtips.hideTip(m.mtip, 0); _this.markers.splice(_this.markers.indexOf(m), 1); m.setMap(); m.tip[0].children[2].disabled = true;});
	m.tip[0].children[2].onclick = (function(e){m.save($(m.tip[0].children[0]).val())});
	m.tipLocked = true;
	setTimeout(function() {m.mtip = _this.mtips.showTip(m.getPosition(), m.tip); m.tip[0].children[0].focus();}, 600);
}

///////////////////////////////////////////////////////


// Default map marker options
markerdefdef = {
	image: '',
	title: '',
	edit: false,
	functional: false,
	tooltip: false,
	click: null,
	init: null
}

// Individual map marker options
markerdef = {
	'event': {tooltip: true, image: 'event', edit: true, functional: true, init: eventInit},
	'camp': {tooltip: true, title: 'Camp ', image: 'camp', edit: true, functional: true, click: null},
}

// Function to add a tool
function addTool(name) {
	tool = $('<div>');
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
	tool = $('<div>');
	tool.title = name.capitalize();
	$(tool).addClass('menu');
	$(tool).css('backgroundImage', "url('resources/" + name + ".png')");
	$(tool).click(boxmenu[name]);
	$('#toolbar').append(tool);
}
