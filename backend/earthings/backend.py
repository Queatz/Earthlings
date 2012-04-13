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
		self.data = stash.Stash(markers.Default())
		self.data[()].setup(self)
	
	def __call__(self, *args, **kwargs):
		try:
			return self.data(args, kwargs)
		except:
			import traceback
			return '<pre>' + traceback.format_exc() + '</pre>'

if __name__ == '__main__':
	cherrypy.quickstart(Earthlings())
