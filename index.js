/* WEB AUDIO API SETUP */

// audio context
const c = new AudioContext({ latencyHint: 0.05, sampleRate: 48000 })

// audio buffers to play soundfiles
let audioBuffers = {}

// master gain
const masterGain = new GainNode(c, { gain: 0.5 })

// dry signal
const leftDry = new GainNode(c)
const rightDry = new GainNode(c)

// delayed signal
const leftDelay = new DelayNode(c, { delayTime: 0.22, maxDelayTime: 2 })
const rightDelay = new DelayNode(c, { delayTime: 0.3, maxDelayTime: 2 })

const leftDelayFeedback = new GainNode(c, { gain: 0.5 })
const rightDelayFeedback = new GainNode(c, { gain: 0.5 })

const leftDelayGain = new GainNode(c, { gain: 0 })
const rightDelayGain = new GainNode(c, { gain: 0 })

leftDelay.connect(leftDelayFeedback)
leftDelayFeedback.connect(leftDelay)

rightDelay.connect(rightDelayFeedback)
rightDelayFeedback.connect(rightDelay)

leftDelay.connect(leftDelayGain)
rightDelay.connect(rightDelayGain)

// merged signal
const merger = new ChannelMergerNode(c, { numberOfInputs: 2 })

leftDry.connect(merger, 0, 0)
leftDelayGain.connect(merger, 0, 0)
rightDry.connect(merger, 0, 1)
rightDelayGain.connect(merger, 0, 1)

merger.connect(masterGain).connect(c.destination)

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

function playSound(soundFile) {
	const source = new AudioBufferSourceNode(c, { buffer: audioBuffers[soundFile], channelCount: 1 })

	source.connect(leftDry)
	source.connect(rightDry)
	source.connect(leftDelay)
	source.connect(rightDelay)
	source.start()

	source.addEventListener('ended', event => {
		source.disconnect()
	})
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
	}

	for (const [id, func] of Object.entries(controls)) {
		const controller = document.getElementById(id)

		controller.addEventListener('input', () => {
			func(controller.value)
		})
	}

}

async function loadCatSounds() {
	const buttonDiv = document.getElementById('buttons')

	for (let i = 0; i < soundFiles.length; i++) {
		audioBuffers[soundFiles[i]] = await loadSound(soundFiles[i])
		const button = document.createElement('button')

		button.innerText = `${keyboard[i]}`

		button.setAttribute('onclick', `playSound("${soundFiles[i]}")`)
		button.setAttribute('class', 'play-button')
		button.setAttribute('style', `background-image: url("${catPics[i]}"); background-size: cover; background-repeat: no-repeat;`)
		button.setAttribute('id', keyboard[i])

		buttonDiv.appendChild(button)

		registerKey(keyboard[i], soundFiles[i])
	}
}

window.onload = () => {
	registerControls()
	loadCatSounds()
}

