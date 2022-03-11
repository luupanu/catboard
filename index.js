/* WEB AUDIO API SETUP */

let pitch = 0
let chord
let detuneRange = 200

// audio context
const c = new AudioContext({ latencyHint: 0.05, sampleRate: 48000 })

// audio buffers to play soundfiles
let audioBuffers = {}

// audio source
let source

// input gain
const inputGain = new GainNode(c, { gain: 0.2 })

// master gain
const masterGain = new GainNode(c, { gain: 0.5 })

// dry signal
const leftDelayDry = new GainNode(c)
const rightDelayDry = new GainNode(c)

// convolution reverb
let convReverb = c.createConvolver()

const reverbGain = new GainNode(c, { gain: 0.2 })

const reverbDry = new GainNode(c)

// delayed signal
const leftDelay = new DelayNode(c, { delayTime: 0.22, maxDelayTime: 2 })
const rightDelay = new DelayNode(c, { delayTime: 0.3, maxDelayTime: 2 })

const leftDelayFeedback = new GainNode(c, { gain: 0.2 })
const rightDelayFeedback = new GainNode(c, { gain: 0.2 })

const leftDelayGain = new GainNode(c, { gain: 1 })
const rightDelayGain = new GainNode(c, { gain: 1 })

leftDelay.connect(leftDelayFeedback)
leftDelayFeedback.connect(leftDelay)

rightDelay.connect(rightDelayFeedback)
rightDelayFeedback.connect(rightDelay)

leftDelay.connect(leftDelayGain)
rightDelay.connect(rightDelayGain)

// merged signal
const merger = new ChannelMergerNode(c, { numberOfInputs: 2 })

inputGain.connect(leftDelayDry)
inputGain.connect(rightDelayDry)
inputGain.connect(leftDelay)
inputGain.connect(rightDelay)

leftDelayDry.connect(merger, 0, 0)
leftDelayGain.connect(merger, 0, 0)
rightDelayDry.connect(merger, 0, 1)
rightDelayGain.connect(merger, 0, 1)

merger.connect(convReverb)
merger.connect(masterGain)

convReverb.connect(reverbGain)
reverbGain.connect(masterGain)
masterGain.connect(c.destination)

/* OTHER SETUP */

// keyboard controls
const keyboard = 'asdfghjkl'

// list of cat pics
const catPics = [
	'cat_1.jpg',
	'cat_2.jpg',
	'cat_3.jpg',
	'cat_4.jpg',
]

// list of soundfiles
const soundFiles = [
	'catboard_1.mp3',
	'catboard_2.mp3',
	'catboard_3.mp3',
	'catboard_4.mp3',
]

/* FUNCTIONS */

async function loadSound(path) {
	const response = await fetch(path)
	const arrayBuffer = await response.arrayBuffer()
	return c.decodeAudioData(arrayBuffer)
}

function play(soundFile) {
	if (document.getElementById('input-chord').checked)
		playChord(soundFile)
	else
		playSound(soundFile)
}

function playSound(soundFile, detuneValue=null) {
	const source = new AudioBufferSourceNode(c, { buffer: audioBuffers[soundFile], channelCount: 1 })

	source.playbackRate.value = 2 ** (pitch / 12);
	source.detune.value = detuneValue || Math.floor(Math.random() * detuneRange)
	console.log(source.detune.value)

	source.connect(inputGain)
	source.start()

	source.addEventListener('ended', event => {
		source.disconnect()
	})
}

function playChord(soundFile) {
	playSound(soundFile, 42)
	pitch += 4
	playSound (soundFile, 24)
	pitch += 3
	playSound(soundFile, 50)
	pitch -= 7
}

function registerKey(key, sound) {
	window.addEventListener('keydown', event => {
		if (event.repeat)
			return

		if (event.key.toLowerCase() == key) {
			const button = document.getElementById(key)
			button.className += " active"
			setTimeout(() => button.className = "play-button", 225)
			button.click()
		}
	})
}

function registerControls() {
	const controls = {
		'input-master': newValue => masterGain.gain.value = newValue,
		'input-delaygain': newValue => {
			leftDelayGain.gain.value = newValue
			rightDelayGain.gain.value = newValue
		},
		'input-delayfeedback': newValue => {
			leftDelayFeedback.gain.value = newValue
			rightDelayFeedback.gain.value = newValue
		},
		'input-ldelaytime': newValue => leftDelay.delayTime.exponentialRampToValueAtTime(newValue, c.currentTime + 0.05),
		'input-rdelaytime': newValue => rightDelay.delayTime.exponentialRampToValueAtTime(newValue, c.currentTime + 0.05),
		'input-reverbgain': newValue => {
			reverbGain.gain.value = newValue
		},
		'input-pitch': newValue => pitch = parseInt(newValue),
		'input-detunerange': newValue => detuneRange = parseInt(newValue)
	}

	for (const [id, func] of Object.entries(controls)) {
		const controller = document.getElementById(id)

		controller.addEventListener('input', () => {
			func(controller.value)
		})

		func(controller.value)
	}

}

async function loadConvolutionReverb() {
	const impulse = await loadSound('arundel_impulse_response_48kHz_modified.wav')
	convReverb.buffer = impulse
}

async function loadCatSounds() {
	const buttonDiv = document.getElementById('buttons')

	for (let i = 0; i < soundFiles.length; i++) {
		audioBuffers[soundFiles[i]] = await loadSound(soundFiles[i])
		const button = document.createElement('button')

		button.innerText = `${keyboard[i]}`

		button.setAttribute('onclick', `play("${soundFiles[i]}")`)
		button.setAttribute('class', 'play-button')
		button.setAttribute('style', `background-image: url("${catPics[i]}"); background-size: cover; background-repeat: no-repeat;`)
		button.setAttribute('id', keyboard[i])

		buttonDiv.appendChild(button)

		registerKey(keyboard[i], soundFiles[i])
	}
}

window.onload = () => {
	registerControls()
	loadConvolutionReverb()
	loadCatSounds()
}

