import cherrypy
import markers
import json

from cherrypy.lib.static import staticfile

import os
current_dir = os.path.dirname(os.path.abspath(__file__))

class Earthlings:
	sp = os.path.join(current_dir, 'sessions')
	if not os.path.isdir(sp):
		os.mkdir(sp)
	
	_cp_config = {
		'tools.sessions.on': True,
		'tools.sessions.storage_type': 'file',
		'tools.sessions.storage_path': sp,
		'tools.sessions.timeout': 60 * 24,
		
		'tools.staticdir.on': True,
		'tools.staticdir.root': current_dir,
		'tools.staticdir.dir': 'static'
	}
	
	del sp
	
	def __init__(self):
		self.stash = markers.Stash()
	
	@cherrypy.expose
	def a(self, *args, **kwargs):
		# Otherwise the session is lost...
		cherrypy.session['keep'] = cherrypy.session.get('keep', 0) + 1
		
		return json.dumps(self.stash(args, kwargs))
	
	@cherrypy.expose
	def index(self):
		return open(os.path.abspath('index.html'), 'r')

if __name__ == '__main__':
	cherrypy.quickstart(Earthlings(), config = {'global': {'server.socket_port': 4000, 'server.socket_host': '0.0.0.0'}})
