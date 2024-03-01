const latitude = 59.2537523183
const longitude = 18.0255632311
const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
const apiUrl = (light) => `http://192.168.1.8/api/oyjHEB1MhokwXXhauN-fgtdTgKBTAKgPawaySIY6/lights/${light}/state`

const headers = {
  'Content-Type': 'application/json',
  method: 'PUT'
}

const body = { 'bri': 10 }

const chunkList = (list, chunkSize) => {
  const chunks = []
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize))
  }

  return chunks
}

const pMapCurried = (fn, concurrency = 1) => async (list) => {
  const chunked = chunkList(list, concurrency)
  const result = []
  for (let i = 0; i < chunked.length; i++) {
    const chunk = chunked[i]
    await Promise.all(chunk.map(fn)).then((res) => result.push(...res))
  }

  return result
}

const warmRange = [15, 35]
const mediumRange = [8, 15]
const coldRange = [-20, 8]

const isInRange = (value, range) => value > range[0] && value < range[1]


const getLights = () => fetch('http://192.168.1.8/api/oyjHEB1MhokwXXhauN-fgtdTgKBTAKgPawaySIY6/lights/').then(res => res.json())
const lights = [2, 3, 4, 5, 6, 7, 8, 11, 12]

const main = async () => {
  const { current } = await fetch(weatherApiUrl).then((res) => res.json())
  const { temperature_2m: temperature } = current
  const warm = isInRange(temperature, warmRange)
  const medium = isInRange(temperature, mediumRange)
  const cold = isInRange(temperature, coldRange)


  const getXyBasedOnTemperature = (temperature) => {
    if (warm) {
      const proximityToMax = temperature / warmRange[1]
      return [proximityToMax * 1, proximityToMax * 1]
    }
    if (medium) {
      const proximityToMax = temperature / mediumRange[1]
      return [proximityToMax * 0.5, proximityToMax * 0.5]
    }
    if (cold) {
      const proximityToMax = temperature / coldRange[1]
      return [proximityToMax * 0.3, proximityToMax * 0.3]
    }
  }

  const lightState = {
    on: true,
    bri: 255,
    sat: 254,
    effect: 'none',
    xy: getXyBasedOnTemperature(temperature),
    ct: 153,
    alert: 'none',
    colormode: 'xy'
  }
  
  const body = JSON.stringify(lightState)
  const urls = lights.map(apiUrl)

  const setLight = (url) => fetch(url, { ...headers, body })
  await pMapCurried(setLight, 2)(urls)
}

main()