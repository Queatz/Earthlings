import json

class Action:
	def __init__(self, p, a, d):
		self.path = p
		self.action = a
		self.data = d

class Live(list):
	def add(self, p, a, d):
		if len(self) < 1 or p != self[-1][0]:
			self.append([p, []])
		self[-1][1].append([a, d])
