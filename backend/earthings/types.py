from earthlings.stash import Item
import cherrypy
import json

class Event(Item):
	def get(self):
		return json.loads([])

class Camp(Item):
	pass

class Category(Item):
	pass

class Item(Item):
	pass
