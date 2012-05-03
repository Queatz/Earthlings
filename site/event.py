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
			'ends': t,
			'hours': m['hours']
		}
	
	def readEvent(self, m, e):
		if e['type'] == 'ends':
			d = m['ends'] - time.time()
			if d <= 0:
				d = None
		elif e['type'] == 'latlng':
			d = m['loc']
		elif e['type'] == 'hours':
			d = m['hours']
		elif e['type'] == 'title':
			d = m['title']
		else:
			return
		
		return (str(m['_id']), e['type'], d)
	
	def act(self, m, a):
		# Edit marker
		if 'edit' in a:
			# 'edit' is itself a dict
			a = json.loads(a['edit'])
			
			# If we are a known session
			if cherrypy.session.id in m['sessions']:
				# Set title (max 256 chars)
				if 'title' in a:
					# Cannot set title a second time
					if 'title' in m:
						return

					# Clip title length
					if len(a['title']) > 256:
						a['title'] = a['title'][:256]
					
					self.stash.update(m['_id'], {'title': a['title']})
					self.stash.insertEvent(m['_id'], 'title')
				
				# Set end time (in hours from now; min 1, max 12)
				if 'ends' in a:
					maxh = (m['hours'] if 'hours' in m else 12) * 60 * 60
					self.stash.update(m['_id'], {'ends': time.time() + min(maxh, max(0, a['ends']))})
					self.stash.insertEvent(m['_id'], 'ends')

				if 'hours' in a:
					# Cannot set hours a second time
					if 'hours' in m:
						return

					self.stash.update(m['_id'], {'hours': min(12, max(1, a['hours']))})
					self.stash.insertEvent(m['_id'], 'hours')

				# Move marker
				if 'latlng' in a:
					# Convert latlng string to loc array
					loc = [float(x) for x in a['latlng'].split(',')]
			
					self.stash.update(m['_id'], {'loc': loc})
					self.stash.insertEvent(m['_id'], 'latlng')