from stash import Item
import cherrypy
import json

import random
import time

def newID():
	"Generate a random hash."
	return hashlib.sha1(str(random.random() + time.time()).encode()).hexdigest()[:16]

class Default(Item):
	def setup(self, stash):
		self.stash = stash
	
	def act(self, a):
		if 'add' in a:
			t = a['add']
			
			# Quick validity check
			if t not in ('event',):
				return
			
			# Create a new marker
			i = newID()
			m = Marker(stash, i)
			
			# Otherwise the session is lost...
			cherrypy.session['keep'] = True
			
			# Add the creating session to editing 
			m.addSession(cherrypy.session.id)
			
			# Add an Event to the marker
			if t == 'event':
				e = Event()
				m.target = e
			
			# Add the new marker's path
			self.stash[(i,)] = m
			
			# Return the marker's ID
			return i
		elif 'rect' in a:
			return json.dumps((self.stash(x) for x in self.stash.getMapped(a['rect'].split(','))))

class Marker(Item):
	def __init__(self, stash, i):
		self.stash = stash
		self.lat = 0
		self.lng = 0
		self.target = None
		self.sessions = []
		self.id = i
	
	def addSession(self, sid):
		self.sessions.append(sid)
	
	def action(self, a):
		# If we are editing the marker's target
		if 'latlng' in a:
			self.lat, self.lng = (float(x) for x in a['latlng'].split(','))
			self.stash.map(self.i, (self.lat, self.lng))
		if 'edit' in a:
			# 'edit' is itself a dict
			a = json.loads(a['edit'])
			# If we are a known session
			if cherrypy.session.id in self.sessions:
				# Then run an edit
				if type(self.target) == Event:
					if 'title' in a:
						self.target.title = a['title']
					
					if 'ends' in a:
						self.target.ends = time.time() + a['ends']
	
	def get(self):
		return json.dumps([self.id, self.target.__class__.__name__.lower(), (self.lat, self.lng, cherrypy.session.id in self.sessions)])

class Event(Item):
	def __init__(self):
		# The event title
		self.title = None
		
		# Real epoch time the event ends at
		self.ends = 0
	
	def get(self):
		t = self.ends - time.time()
		return json.dumps(['event', self.title, t if t > 0 else 0])

class Camp(Item):
	pass

class Category(Item):
	pass

class Item(Item):
	pass
