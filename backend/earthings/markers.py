from stash import Item
import cherrypy
import json

import random
import time

def newID():
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
			
			m = Marker()
			i = newID()
			
			# Otherwise the session is lost...
			cherrypy.session['keep'] = True
			
			m.addSession(cherrypy.session.id)
			
			if t == 'event':
				e = Event()
				m.target = e
			
			self.stash[(i,)] = m
			
			return i

class Marker(Item):
	def __init__(self):
		self.lat = 0
		self.lng = 0
		self.target = None
		self.sessions = []
	
	def addSession(self, sid):
		self.sessions.append(sid)
	
	def action(self, a):
		# If we are editing the marker's target
		if 'latlng' in a:
			self.lat, self.lng = (float(x) for x in a['latlng'].split(' '))
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
		return json.dumps([self.target.__class__.__name__, self.lat, self.lng])

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
