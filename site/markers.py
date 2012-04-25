import pymongo as mongo, bson
import cherrypy
import json
import time

class Stash:
	def __init__(self):
		c = mongo.Connection()
		
		if 'earthlings' not in c.database_names():
			c.earthlings.markers.create_index([('loc', mongo.GEO2D)])
	
		self.db = c['earthlings']
		self.mk = self.db['markers']
	
	def __call__(self, p, a = None):
		if p == ():
			if 'add' in a:
				t = a['add']
			
				# Quick validity check
				if t not in ('event',):
					return
			
				# Create a new marker
				m = {
					'type': t,
					'sessions': [cherrypy.session.id]
				}
				
				i = self.mk.insert(m)
				
				# Return the marker's ID
				return str(i)
			elif 'rect' in a:
				c = tuple(float(x) for x in a['rect'].split(','))
				c = [[c[0], c[1]], [c[2], c[3]]]
				return [self((x['_id'],)) for x in self.mk.find({'loc': {'$within': {'$box': c}}})]
		else:
			i = bson.objectid.ObjectId(p[0])
			
			m = self.mk.find_one({'_id': i})
			
			if not m:
				return
			
			if not a:
				return [str(m['_id']), m['type'], cherrypy.session.id in m['sessions'], m['loc'], [m['title'], max(0, m['ends'] - time.time())] if m['type'] == 'event' else None]
			else:
				if 'latlng' in a:
					loc = [float(x) for x in a['latlng'].split(',')]
					self.mk.update({'_id': i}, {'$set': {'loc': loc}})
				if 'edit' in a:
					# 'edit' is itself a dict
					a = json.loads(a['edit'])
					# If we are a known session
					if cherrypy.session.id in m['sessions']:
						# Then run an edit
						if m['type'] == 'event':
							if 'title' in a:
								self.mk.update({'_id': i}, {'$set': {'title': a['title']}})
							if 'ends' in a:
								self.mk.update({'_id': i}, {'$set': {'ends': time.time() + min(12, max(1, int(a['ends']))) * 60 * 60}})
