import cherrypy
import stash
import markers

from cherrypy.lib.static import staticfile

import os
current_dir = os.path.dirname(os.path.abspath(__file__))

class Earthlings:
	_cp_config = {
		'tools.sessions.on': True,
		'tools.sessions.timeout': 60 * 24,
		
		'tools.staticdir.on': True,
		'tools.staticdir.root': current_dir,
		'tools.staticdir.dir': 'static'
	}
	
	def __init__(self):
		self.stash = stash.Stash(markers.Default())
		self.stash[()].setup(self.stash)
	
	@cherrypy.expose
	def a(self, *args, **kwargs):
		# Otherwise the session is lost...
		cherrypy.session['keep'] = cherrypy.session.get('keep', 0) + 1
	
		a = self.stash(args, kwargs)
		print('\033[1;31m', cherrypy.session.id, '\033[0m')
		return a
	
	@cherrypy.expose
	def index(self):
		return open(os.path.abspath('index.html'), 'r')

if __name__ == '__main__':
	cherrypy.quickstart(Earthlings(), config = {'global': {'server.socket_port': 4000, 'server.socket_host': '0.0.0.0'}})
