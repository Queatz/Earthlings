import pymongo as mongo, bson
import cherrypy
import json
import time
import live

class Handler:
	def json(self): pass
	def act(self): pass

class Stash:
	def __init__(self):
		# Connect to database
		c = mongo.Connection()
		
		# Set up database
		if 'earthlings' not in c.database_names():
			c.earthlings.markers.create_index([('loc', mongo.GEO2D)])
			c.earthlings.events.create_index([('loc', mongo.GEO2D)])
		
		# Database links
		self.db = c['earthlings']
		self.mk = self.db['markers']
		self.ev = self.db['events']
		
		# Type handlers
		self.handle = {}
	
	def addHandler(self, name, handle):
		self.handle[name] = handle
	
	def update(self, i, d):
		self.mk.update({'_id': i}, {'$set': d})
	
	def insertEvent(self, t, i = None, x = None):
		d = {
			'type': t,
			'time': time.time()
		}
		
		if i: d['id'] = i
		if x: d['data'] = x
		
		self.ev.insert(d)
	
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
				if t not in ('event',):
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
				
				# Event
				self.insertEvent('add', i)
				
				# Return the marker's ID as a string
				return str(i)
			
			# Get markers in a chosen area
			elif 'rect' in a:
				# Convert rect string to array box
				c = tuple(float(x) for x in a['rect'].split(','))
				c = [[c[0], c[1]], [c[2], c[3]]]
				
				# Return markers within rect bounds
				r = live.Live()
				
				for x in self.markersWithin(c):
					d = self((x['_id'],))
					r.add('', 'add', [
						d['id'],
						d['type'],
						[
							['mine', d['mine']],
							['latlng', d['latlng']],
						] + [[y, d['data'][y]] for y in d['data']]
					])
				
				# For events
				cherrypy.session['showing'] = [x[0] for x in r]
				cherrypy.session['rect'] = c
				cherrypy.session['full refresh'] = time.time()
				
				return r
			elif 'events' in a:
				cherrypy.session['full refresh'] = time.time()
		
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
				# Move marker
				if 'latlng' in a:
					# Convert latlng string to loc array
					loc = [float(x) for x in a['latlng'].split(',')]
			
					# Event
					self.insertEvent('move', m['_id'])
			
					# Update loc
					self.mk.update({'_id': i}, {'$set': {'loc': loc}})
				else:
					# Type-specific actions
					return self.handle[m['type']].act(m, a)
