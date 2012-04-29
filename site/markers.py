import pymongo as mongo, bson
import cherrypy
import json
import time

class Stash:
	def __init__(self):
		# Connect to database
		c = mongo.Connection()
		
		# Set up database
		if 'earthlings' not in c.database_names():
			c.earthlings.markers.create_index([('loc', mongo.GEO2D)])
		
		# Database links
		self.db = c['earthlings']
		self.mk = self.db['markers']
	
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
				
				# Return the marker's ID as a string
				return str(i)
			
			# Get markers in a chosen area
			elif 'rect' in a:
				# Convert rect string to array box
				c = tuple(float(x) for x in a['rect'].split(','))
				c = [[c[0], c[1]], [c[2], c[3]]]
				
				# Return markers within rect bounds
				return [self((x['_id'],)) for x in self.mk.find(
					{
						# Within box
						'loc': {'$within': {'$box': c}},
						# If marker ends at a certain time, then don't fetch it
						'$or': [
							{'ends': {'$gt': time.time()}},
							{'ends': {'$exists': False}}
						]
					}
				)]
		
		# Marker actions
		else:
			# Convert path into ID
			i = bson.objectid.ObjectId(p[0])
			
			# Fetch any marker with that ID
			m = self.mk.find_one({'_id': i})
			
			# Do nothing if no marker was found
			if not m:
				return
			
			# If not performing an action, then get the marker
			if not a:
				# If marker expired then don't expose it
				t = m['ends'] - time.time()
				if t <= 0:
					return None
				
				# Return marker signature [id, type, mine, loc, [...]]
				# Event [...]: [title, ends]
				return [str(m['_id']), m['type'], cherrypy.session.id in m['sessions'], m['loc'], [m['title'], t] if m['type'] == 'event' else None]
			
			# Performing an action...
			else:
				# Move marker
				if 'latlng' in a:
					# Convert latlng string to loc array
					loc = [float(x) for x in a['latlng'].split(',')]
					
					# Update loc
					self.mk.update({'_id': i}, {'$set': {'loc': loc}})
				
				# Edit marker
				if 'edit' in a:
					# 'edit' is itself a dict
					a = json.loads(a['edit'])
					
					# If we are a known session
					if cherrypy.session.id in m['sessions']:
						# Then run an edit
						if m['type'] == 'event':
							# Set title (max 256 chars)
							if 'title' in a:
								self.mk.update({'_id': i}, {'$set': {'title': a['title']}})
							
							# Set end time (in hours from now; min 1, max 12)
							if 'ends' in a:
								self.mk.update({'_id': i}, {'$set': {'ends': time.time() + min(12, max(1, int(a['ends']))) * 60 * 60}})
