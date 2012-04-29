from markers import Handler

import cherrypy
import time
import json

class Handler(Handler):
	def __init__(self, stash):
		self.stash = stash
	
	def json(self, m):
		# Convert end time to ends in time
		t = m['ends'] - time.time()
		
		# If Event marker expired then don't expose it
		if t <= 0:
			return None
		
		return {
			'title': m['title'],
			'ends': t
		}
	
	def act(self, m, a):
		# Edit marker
		if 'edit' in a:
			# 'edit' is itself a dict
			a = json.loads(a['edit'])
			
			# If we are a known session
			if cherrypy.session.id in m['sessions']:
				# Set title (max 256 chars)
				if 'title' in a:
					# Clip title length
					if len(a['title']) > 256:
						a['title'] = a['title'][:256]
					
					self.stash.update(m['_id'], {'title': a['title']})
					self.stash.insertEvent('update', m['_id'], 'title')
				
				# Set end time (in hours from now; min 1, max 12)
				if 'ends' in a:
					self.stash.update(m['_id'], {'ends': time.time() + min(12, max(.25, a['ends'])) * 60 * 60})
					self.stash.insertEvent('update', m['_id'], 'ends')
