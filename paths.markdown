#####################################

#	Client

#####################################

## The structure of response

[
	['id', [
			['event', ...],
		] ],
]

## Explaination, by opening bracket

1) An endless array of
2) A two element array of a path and
3) An endless array of
4) A two element array of an action and data

## In practice: Adding an event to the map

[
	['', [
		['add', ['ig39gi93i9i5900403344', 'event', [
			['mine', True],
			['latlng', [9.43432, 43.53941]],
			['title', 'Probably boating.'],
			['ends', 3]
		] ]]
	] ]
]

# Or

[
	['', [
		['+', ['ig39gi93i9i5900403344', 'event']]
	] ],
	['ig39gi93i9i5900403344', [
		['mine', true],
		['latlng', [9.43432, 43.53941]],
		['title', 'Probably boating.'],
		['ends', 3]
	] ]
]

## In practice: Updating Event title

[
	['ig39gi93i9i5900403344', [
		['title', 'Probably boating.'],
	] ]
]

## In practice: Moving a marker

[
	['ig39gi93i9i5900403344', [
		['latlng', [12.32, 23.43]],
	] ]
]

#####################################

#	Server

#####################################

## The structure of request

[
	['id', [
			['event', ...],
		] ],
]
