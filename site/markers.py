from stash import Item
import cherrypy
import json

import hashlib
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
			m = Marker(self.stash, i)
			
			# Add the creating session to editing 
			m.addSession(cherrypy.session.id)
			
			# Add an Event to the marker
			if t == 'event':
				e = Event()
				m.target = e
			else:
				print('\033[1;32mInvalid type created.\033[0m')
			
			# Add the new marker's path
			self.stash[(i,)] = m
			
			# Return the marker's ID
			return json.dumps(i)
		elif 'rect' in a:
			return json.dumps([self.stash[(x,)].data() for x in self.stash.getMapped(tuple(float(x) for x in a['rect'].split(',')))])

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
	
	def data(self):
		return [self.id, self.target.__class__.__name__.lower(), cherrypy.session.id in self.sessions, [self.lat, self.lng], self.target.data() if self.target else None]
	
	def act(self, a):
		# If we are editing the marker's target
		if 'latlng' in a:
			self.lat, self.lng = (float(x) for x in a['latlng'].split(','))
			self.stash.map(self.id, (self.lat, self.lng))
		if 'edit' in a:
			# 'edit' is itself a dict
			a = json.loads(a['edit'])
			# If we are a known session
			print('editing...')
			if cherrypy.session.id in self.sessions:
				print('allowed...')
				# Then run an edit
				if type(self.target) == Event:
					if 'title' in a:
						self.target.title = a['title']
						print('', 'set title to', a['title'], '')
					
					if 'ends' in a:
						self.target.ends = time.time() + int(a['ends'])
	
	def get(self):
		return json.dumps(self.data())

class Event():
	def __init__(self):
		# The event title
		self.title = None
		
		# Real epoch time the event ends at
		self.ends = 0
	
	def data(self):
		t = self.ends - time.time()
		return ['event', self.title, t if t > 0 else 0]

class Camp():
	pass

class Category():
	pass

class Item():
	pass
