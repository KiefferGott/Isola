var socket = io.connect('http://localhost:8080');
function makeGrid() {
	var grid = [];
	for (var i = 0; i < 7; i++) {
		grid[i] = [];
		for (var e = 0; e < 7; e++) {
			grid[i][e] = 0;
		}
	}
	return grid;
}
function checkTraject(y, x, grid) {
	y = parseInt(y);
	x = parseInt(x)
	var availableMove = [];
	if ((y + 1) < 7) {
		if ((y + 1) < 7 && grid[y + 1][x] === 0) {
			availableMove.push((y + 1) + '-' + x);
			document.getElementById((y + 1) + '-' + x).style.backgroundColor = 'green';
		}
		if ((y + 1) < 7 && grid[y + 1][x - 1] === 0) {
			availableMove.push((y + 1) + '-' + (x - 1));
			document.getElementById((y + 1) + '-' + (x - 1)).style.backgroundColor = 'green';
		}
		if ((y + 1) < 7 && grid[y + 1][x + 1] === 0) {
			availableMove.push((y + 1) + '-' + (x + 1));
			document.getElementById((y + 1) + '-' + (x + 1)).style.backgroundColor = 'green';
		}
	}
	if ((y - 1) >= 0) {
		if ((y - 1) >= 0 && grid[y - 1][x] === 0) {
			availableMove.push(y - 1 + '-' + x);
			document.getElementById(y - 1 + '-' + x).style.backgroundColor = 'green';
		}
		if ((y - 1) >= 0 && grid[y - 1][x - 1] === 0) {
			availableMove.push((y - 1) + '-' + (x - 1));
			document.getElementById((y - 1) + '-' + (x - 1)).style.backgroundColor = 'green';
		}
		if ((y - 1) >= 0 && grid[y - 1][x + 1] === 0) {
			availableMove.push((y - 1) + '-' + (x + 1));
			document.getElementById((y - 1) + '-' + (x + 1)).style.backgroundColor = 'green';
		}
	}
	if (grid[y][x + 1] === 0) {
		availableMove.push(y + '-' + (x + 1));	
		document.getElementById(y + '-' + (x + 1)).style.backgroundColor = 'green';
	}
	if (grid[y][x - 1] === 0) {
		availableMove.push(y + '-' + (x - 1));
		document.getElementById(y + '-' + (x - 1)).style.backgroundColor = 'green';
	}
	if (availableMove.length) {
		return availableMove;
	}
	else {
		return false;
	}
}
function removeTraject(grid) {
	grid.forEach(function (element, index) {
		document.getElementById(element).style.backgroundColor = '';
	});
}
function closeCell(y, x, grid) {
	document.getElementById(y + '-' + x).style.backgroundColor = 'grey';
	grid[y][x] = false;
}
function move(y, x, id) {
	document.getElementById(id).style.top = y * 60 + 'px';
	document.getElementById(id).style.left = x * 60 + 'px';
}
$(function () {
	var side;
	var pion;
	var other;
	var Grid = makeGrid();
	Grid[6][3] = 'Red';
	Grid[0][3] = 'Blue';
	socket.once('side', function (data) {
		side = data;
		pion = {y: side === 'Blue' ? 0 : 6, x: 3};
		other = {y: side === 'Blue' ? 6 : 0, x: 3};
		if (data) {
			alert('You are ' + data + ' side.');
		}
		else {
			alert('Both side are taken. But you can watch them play !');
		}
	});
	socket.once('message', function (data) {
		alert(data);
	});
	var phase = 'OVER';
	var availableCell;
	socket.once('player', function (data) {
		socket.on('yourTurn', function (data) {
			availableCell = checkTraject(pion.y, pion.x, Grid);
			if (availableCell !== false) {
				phase = 'MOVE';
			}
			else {
				alert('Game Over');
			}
		});
	});
	$('body').click(function (e) {
		var coord;
		if (phase === 'MOVE' && availableCell.indexOf(e.target.id) >= 0) {
			removeTraject(availableCell);
			coord = e.target.id.split('-');
			coord[0] = parseInt(coord[0]);
			coord[1] = parseInt(coord[1]);
			move(coord[0], coord[1], side);
			Grid[pion.y][pion.x] = 0;
			Grid[coord[0]][coord[1]] = side;
			pion.y = coord[0];
			pion.x = coord[1];
			socket.emit('play', {y: coord[0], x: coord[1]});
			phase = 'DELETE';
		}
		else if (phase === 'DELETE' && e.target.id !== 'Blue' && e.target.id !== 'Red') {
			coord = e.target.id.split('-');
			coord[0] = parseInt(coord[0]);
			coord[1] = parseInt(coord[1]);
			if (Grid[coord[0]][coord[1]] === 0) {
				closeCell(coord[0], coord[1], Grid);
				socket.emit('cellDelete', {y: coord[0], x: coord[1]});
				phase = 'OVER';
			}
		}
	});
	socket.on('playerMoved', function (data) {
		move(data.y, data.x, data.id);
		Grid[data.y][data.x] = data.id;
		Grid[other.y][other.x] = 0;
		other.y = data.y;
		other.x = data.x;
	});
	socket.on('cellDeleted', function (data) {
		closeCell(data.y, data.x, Grid);
	});
});