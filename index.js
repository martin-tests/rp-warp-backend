const express = require('express')
const cors = require('cors')
const nodeFetch = require('node-fetch')
const app = express()
const port = 3000

app.use(express.json())
app.use(cors({origin: ['http://localhost:5173', 'http://127.0.0.1:5173']}))

const API_URL = 'https://warp-regulator-bd7q33crqa-lz.a.run.app/api'
const STATUS_INTERVAL_MS = 1000 // status check interval in milliseconds
const MAX_ADJUST_RATE = 0.2
const INCREASE = 'increase'
const DECREASE = 'decrease'
const MATTER = 'matter'
const ANTIMATTER = 'antimatter'
const LOW = 'LOW'
const HIGH = 'HIGH'
const OPTIMAL = 'OPTIMAL'
let authCode = ''
let intervalId = null
let matterAdjustment = null
let antimatterAdjustment = null
let startDT = null
let latestDT = null
let secondsElapsed = null
let engineState = null
let status = null

const endAdjustmentProcess = () => {
  clearInterval(intervalId)
}

const adjustIntermix = async (status) => {
  
  if (status.intermix < 0.5) {
    // if there's more antimatter 
    if (status.flowRate === LOW) {
      // and need to increase components
      matterAdjustment = 0.1
      antimatterAdjustment = 0.25 * matterAdjustment
    } else if (status.flowRate === HIGH) {
      // and need to decrease components
      antimatterAdjustment = -0.1
      matterAdjustment = 0.25 * antimatterAdjustment
    } else if (status.flowRate === OPTIMAL) {
      matterAdjustment = 0.1
      antimatterAdjustment = -0.05
    }
  } else {
    // if there's more matter
    if (status.flowRate === LOW) {
      // and need to increase components
      antimatterAdjustment = 0.1
      matterAdjustment = 0.25 * antimatterAdjustment
    } else if (status.flowRate === HIGH) {
      // and need to decrease components
      matterAdjustment = -0.1
      antimatterAdjustment = 0.25 * matterAdjustment
    } else if (status.flowRate === OPTIMAL) {
      antimatterAdjustment = 0.1
      matterAdjustment = -0.05
    }
  }

  latestDT = new Date()
  secondsElapsed = Math.floor((latestDT.valueOf() - startDT.valueOf()) / 1000)
  console.log("secondsElapsed", secondsElapsed, "matter adjustment:", matterAdjustment, "antimatter adjustment:", antimatterAdjustment)
  
  nodeFetch(API_URL + '/adjust/matter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'authorizationCode': authCode,
      'value': matterAdjustment
    })
  })

  nodeFetch(API_URL + '/adjust/antimatter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'authorizationCode': authCode,
      'value': antimatterAdjustment
    })
  })
  
}

const adjustWarpEngine = async () => {
  const statusResponse = await nodeFetch(API_URL + '/status?authorizationCode=' + authCode)
  status = await statusResponse.json()
  console.log("Engine status:", status)
  if (status.statusCode === 400) { 
    // Engine parameters have exceeded acceptable range, simulation terminated
    engineState = 'Engine failed'
    endAdjustmentProcess()
  } else {
    adjustIntermix(status)
  }
}

app.post('/start', async (req, res) => {
  const userData = req.body
  const startResponse = await nodeFetch(API_URL + '/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  const startData = await startResponse.json()
  authCode = startData.authorizationCode
  engineState = startData.message
  startDT = new Date()
  if (intervalId) {
    endAdjustmentProcess()
  }
  intervalId = setInterval(adjustWarpEngine, STATUS_INTERVAL_MS)
  res.send(JSON.stringify({...startData}))
})

app.post('/stop', async (req, res) => {
  engineState = 'Engine stopped'
  endAdjustmentProcess()
  res.json({message: 'Engine stopped'})
})

app.get('/status', async (req, res) => {
  res.json({
    engineState,
    status,
    secondsElapsed,
    intermix: status ? status.intermix : null,
    flowRate: status ? status.flowRate : null,
    matterAdjustment,
    antimatterAdjustment,
    latestDT
  })
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})