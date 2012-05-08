import cherrypy
from cherrypy.lib.static import staticfile
import markers
import json

import event, camp

import os
current_dir = os.path.dirname(os.path.abspath(__file__))

class Earthlings:
	# Get absolute path to sessions folder
	sp = os.path.join(current_dir, 'sessions')
	
	# Create sessions folder if it is not already created
	if not os.path.isdir(sp):
		os.mkdir(sp)
	
	# Main config
	_cp_config = {
		# Enable session
		'tools.sessions.on': True,
		'tools.sessions.storage_type': 'file',
		'tools.sessions.storage_path': sp,
		'tools.sessions.timeout': 60 * 24,
		
		# Everything in static/ is served normally
		'tools.staticdir.on': True,
		'tools.staticdir.root': current_dir,
		'tools.staticdir.dir': 'static'
	}
	
	del sp
	
	def __init__(self):
		self.stash = markers.Stash()
		self.stash.addHandler('event', event.Handler(self.stash))
		self.stash.addHandler('camp', camp.Handler(self.stash))
	
	@cherrypy.expose
	def a(self, *args, **kwargs):
		# To support multiple instances in the same session
		if len(args) < 1:
			return
		
		cherrypy.session.inst = args[0]
		
		if cherrypy.session.inst not in cherrypy.session:
			cherrypy.session[cherrypy.session.inst] = {}
		
		args = args[1:]
		
		# Return the stash's response
		return json.dumps(self.stash(args, kwargs), separators = (',',':'))
	
	@cherrypy.expose
	def index(self):
		# The one and only
		return open(os.path.abspath('static/index.html'), 'r')

if __name__ == '__main__':
	cherrypy.quickstart(Earthlings(), config = {'global': {'server.socket_port': 4000, 'server.socket_host': '0.0.0.0'}})
