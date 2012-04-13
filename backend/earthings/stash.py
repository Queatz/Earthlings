#import sqlite3

class Item:
	def get(self): pass
	def act(self, a): pass

class Stash(dict):
	def __init__(self, default = None):
		# All paths are made through actions on the default
		if not default:
			default = Item()
		
		# Set the default action
		self[(,)] = default
	
	def __call__(self, path, action):
		if action:
			if path not in self:
				return
			
			return self[path].act(action)
			
		else:
			if path not in self:
				return
			
			return self[path].get()
