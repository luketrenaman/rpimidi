var audiocontext = new AudioContext()
let pixels = []
let extra = []
var synth = new Tone.PolySynth(30, Tone.Synth
).toMaster();
synth.set({type:"square"})
//synth.oscillator.type = "sine"
function Note(data) {
	this.data = data;
	this.y = 0;
	this.height = 0;
}
document.getElementById("set").onclick = function() {
	pixels = []
	extra = []
	if (!isNaN(Number(document.getElementById("value").value))) {
		rt = false

		function note(data, me, next) {
			//draw()
			let dex = -1
			console.log(data[me][0])
			if (data[me][0] != 176) {
				if (!pixels.some(function(note, index) {
						dex = index;
						return note.data[1] === data[me][1];
					})) {
					console.log("nosplice")
					pixels.push(new Note(data[me]));
					synth.triggerAttack(Tone.Midi(data[me][1]).toFrequency())
					//console.log(data);
				} else {
					synth.triggerRelease(Tone.Midi(data[me][1]).toFrequency());
					console.log("splice")
					extra.push(pixels[dex])
					pixels.splice(dex, 1);
				}
				console.log(data[next][3] - data[me][3])
			}
			if (!rt) {
				setTimeout(function() {
					note(data, me + 1, next + 1)
				}, data[next][3] - data[me][3]);
			}
		}
		$.getJSON("http://localhost:3000/sessions/midi-" + (Number(document.getElementById("value").value) - 1).toString() + ".json", function(data) {
			for (i = data.length - 1; i > 0; i--) {
				data[i][3] -= data[0][3]
			}
			console.log(data);
			note(data, 0, 1)
		})
	} else {
		if (document.getElementById("value").value === "live") {
			rt = true;
		}
	}
}
let rt = true;
var socket = io.connect('http://localhost:3000/');
lastTime = (new Date()).getTime()
socket.on('connect', function(data) {
	socket.emit('join', 'Hello World from client');
	socket.on('messages', function(data) {
		if (rt) {
			//draw()
			let dex = -1
			if (data[0] != 176) {
				if (!pixels.some(function(note, index) {
						dex = index;
						return note.data[1] === data[1];
					})) {
					if(data[0] == 144){
						synth.triggerAttack(Tone.Midi(data[1]).toFrequency());
						pixels.push(new Note(data));
					}
					//console.log(data);
				} else {
					console.log("splice")
					if(data[0] == 144){
						synth.triggerRelease(Tone.Midi(data[1]).toFrequency());
						extra.push(pixels[dex])
						pixels.splice(dex, 1);
					}
				}
			}
		}
	})
});
//0 2 3 5 8 10 11
function draw() {
	let winUnit = window.innerWidth / 89
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
	sprites = [];
	for (i = 19; i < 88 + 20; i++) {
		if (i % 12 === 0 || i % 12 === 2 || i % 12 === 3 || i % 12 === 5 || i % 12 === 7 || i % 12 === 9 || i % 12 === 10) {
			ctx.fillStyle = "#ffffff"
			ctx.fillRect(winUnit * i - 19 * winUnit, window.innerHeight - 100, window.innerWidth / 8, 100);
		} else {
			ctx.fillStyle = "#000000"
			ctx.fillRect(winUnit * i - 19 * winUnit, window.innerHeight - 100, window.innerWidth / 88, 50);
			ctx.stroke();
			ctx.fillStyle = "#ffffff"
			ctx.fillRect(winUnit * i - 19 * winUnit, window.innerHeight - 50, window.innerWidth / 88, 50);
		}
		//x,y,width,heigh
		ctx.stroke();
	}
	//...drawing code...
	ctx.fillStyle = "#ff0000"
	i % 12 === 0 || i % 12 === 2 || i % 12 === 3 || i % 12 === 5 || i % 12 === 7 || i % 12 === 9 || i % 12 === 10
	currentTime = (new Date()).getTime();
	delta = (currentTime - lastTime) / 5;
	pixels.forEach(function(note, index) {
		if (note.data[2] > 0) {
			note.y += delta
			note.height += delta
			//console.log(winUnit*note.data[1]-19*winUnit)
			ctx.fillRect(winUnit * note.data[1] - 21 * winUnit, window.innerHeight - 100 - note.y, window.innerWidth / 88, note.height);
			ctx.stroke();
		}
	})
	extra.forEach(function(note) {
		note.y += delta
		ctx.fillRect(winUnit * note.data[1] - 21 * winUnit, window.innerHeight - 100 - note.y, window.innerWidth / 88, note.height);
		ctx.stroke();
	})
	lastTime = (new Date()).getTime()
	requestAnimationFrame(draw)
}
requestAnimationFrame(draw)
