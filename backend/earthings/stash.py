#import sqlite3

class Item:
	def get(self): pass
	def act(self, a): pass

class Stash(dict):
	def __init__(self, default = None):
		# All paths are made through actions on the default
		if not default:
			default = Item()
		
		default.setup(self)
		
		# Set the default action
		self[()] = default
		
		self._map = dict()
	
	def map(self, i, p):
		self._map[p] = i
	
	def getMapped(self, r):
		for i in self._map:
			if i[0] > r[0] and i[0] < r[2] and i[1] > r[1] and i[1] < r[3]:
				yield self._map[i]
	
	def __call__(self, path, action):
		if action:
			if path not in self:
				return
			
			return self[path].act(action)
			
		else:
			if path not in self:
				return
			
			return self[path].get()
