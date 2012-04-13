import cherrypy
import stash
import types

class Earthlings:
	exposed = True
	
	_cp_config = {
		'tools.sessions.on': True,
		'tools.sessions.timeout': 60 * 24
	}
	
	def __init__(self):
		self.data = stash.Stash(types.Default())
		self.data((,), {'_setup': None})
	
	def __call__(self, *args, **kwargs):
		return self.data(args, kwargs)

if __name__ == '__main__':
	cherrypy.quickstart(Earthlings())
