import cherrypy
import stash
import markers

class Earthlings:
	exposed = True
	
	_cp_config = {
		'tools.sessions.on': True,
		'tools.sessions.timeout': 60 * 24
	}
	
	def __init__(self):
		self.stash = stash.Stash(markers.Default())
		self.stash[()].setup(self.stash)
	
	def __call__(self, *args, **kwargs):
		print(args, kwargs)
		cherrypy.response.headers['Access-Control-Allow-Origin'] = 'http://localhost';
		try:
			a = self.stash(args, kwargs)
			return a
		except:
			import traceback
			return '<pre>' + traceback.format_exc() + '</pre>'

if __name__ == '__main__':
	cherrypy.quickstart(Earthlings())
