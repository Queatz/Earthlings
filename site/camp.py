from markers import Handler

import cherrypy
import time
import json

class Handler(Handler):
	def __init__(self, stash):
		self.stash = stash

	def act(self, m, a):
		# Only continue if we are a known session
		if cherrypy.session.id not in m['sessions']:
			return
		
		# Edit marker
		if 'edit' in a:
			# 'edit' is itself a dict
			a = json.loads(a['edit'])
			
			# Move marker
			if 'latlng' in a:
				# Can't move camps
				if 'loc' in m:
					return
				
				# Convert latlng string to loc array
				loc = [float(x) for x in a['latlng'].split(',')]
		
				self.stash.update(m['_id'], {'loc': loc})
				self.stash.insertEvent(m['_id'], 'latlng')
