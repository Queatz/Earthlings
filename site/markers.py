import pymongo as mongo, bson
import cherrypy
import json
import time
import live

class Handler:
	def json(self, m): return {}
	def act(self, m, a): pass

class MapLive(live.Live):
	def __init__(self, stash):
		live.Live.__init__(self)
		self.stash = stash
	
	def full(self, i):
		d = self.stash((i,))
		self.add('', 'add', [
			d['id'],
			d['type'],
			[
				['mine', d['mine']],
				['latlng', d['latlng']],
			] + [[y, d['data'][y]] for y in d['data']]
		])

class Stash:
	def __init__(self):
		# Connect to database
		c = mongo.Connection()
		
		# Set up database
		if 'earthlings' not in c.database_names():
			c.earthlings.markers.create_index([('loc', mongo.GEO2D)])
			c.earthlings.events.create_index([('id', mongo.ASCENDING), ('type', mongo.ASCENDING)], unique = True)
		
		# Database link
		self.db = c['earthlings']
		
		# The Markers
		self.mk = self.db['markers']
		
		# Real time events
		self.ev = self.db['events']
		
		# Type handlers
		self.handle = {}
	
	def instance(self):
		return cherrypy.session.id + '-' + cherrypy.session.inst
	
	def addHandler(self, name, handle):
		self.handle[name] = handle
	
	def update(self, i, d):
		self.mk.update({'_id': i}, {'$set': d})
	
	def insertEvent(self, i, t):
		self.ev.update({'id': i, 'type': t}, {'$set': {'time': time.time(), 'inst': self.instance()}}, True)
	
	def markersWithin(self, c):
		return self.mk.find(
			{
				# Within box
				'loc': {'$within': {'$box': c}},
				# If marker ends at a certain time, then don't fetch it
				'$or': [
					{'ends': {'$gt': time.time()}},
					{'ends': {'$exists': False}}
				]
			}
		)
	
	def __call__(self, p, a = None):
		# Global actions
		if p == ():
			# Add a marker
			if 'add' in a:
				t = a['add']
			
				# Quick validity check
				if t not in ('event', 'camp'):
					return
			
				# Create a new marker
				m = {
					# Type of marker
					'type': t,
					
					# Sessions that own this marker (usually just one)
					'sessions': [cherrypy.session.id]
				}
				
				# Insert marker and get it's ID
				i = self.mk.insert(m)
				
				# Return the marker's ID as a string
				return str(i)
			
			# Get markers in a chosen area
			elif 'rect' in a:
				# Convert rect string to array box
				c = tuple(float(x) for x in a['rect'].split(','))
				c = [[c[0], c[1]], [c[2], c[3]]]
				
				# Return markers within rect bounds
				r = MapLive(self)
				
				for x in self.markersWithin(c):
					r.full(x['_id'])
				
				# For events
				cherrypy.session[cherrypy.session.inst]['showing'] = [x[0] for x in r]
				cherrypy.session[cherrypy.session.inst]['rect'] = c
				cherrypy.session[cherrypy.session.inst]['refresh'] = time.time()
				
				return r
			elif 'events' in a:
				if 'rect' not in cherrypy.session[cherrypy.session.inst]:
					return None
				
				r = MapLive(self)
				
				
				if cherrypy.session[cherrypy.session.inst]['showing']:
					for x in self.ev.find({
						'time': {'$gt': cherrypy.session[cherrypy.session.inst]['refresh']},
						'$or': [{'id': x} for x in cherrypy.session[cherrypy.session.inst]['showing']],
						'inst': {'$ne': self.instance()}
					}):
						m = self.mk.find_one({'_id': x['id']})
						if not m:
							continue
					
						e = self.handle[m['type']].readEvent(m, x)
					
						if not e:
							continue
					
						r.add(*e)
				
				# For new and moved events
				for x in self.markersWithin(cherrypy.session[cherrypy.session.inst]['rect']):
					if x['_id'] not in cherrypy.session[cherrypy.session.inst]['showing']:
						cherrypy.session[cherrypy.session.inst]['showing'].append(x['_id'])
						r.full(x['_id'])
				
				cherrypy.session[cherrypy.session.inst]['refresh'] = time.time()
				
				return r
		
		# Marker actions
		else:
			# Convert path into ID
			i = bson.objectid.ObjectId(p[0])
			
			# Fetch any marker with that ID
			m = self.mk.find_one({'_id': i})
			
			# Do nothing if no marker was found
			if not m:
				return None
			
			# If not performing an action, then get the marker
			if not a:
				# Type-specific data for the marker
				data = self.handle[m['type']].json(m)
				
				# All markers have some data
				if data is None:
					return None
				
				# Return marker signature
				return {
					'id': str(m['_id']),
					'type': m['type'],
					'mine': cherrypy.session.id in m['sessions'],
					'latlng': m['loc'],
					'data': data
				}
			
			# Performing an action...
			else:
				return self.handle[m['type']].act(m, a)
