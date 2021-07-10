const express = require('express')
const axios = require('axios')
const cors = require('cors')
const Redis = require('redis')

const redisClient = Redis.createClient() // Redis Client

const app = express() // Express app
app.use(cors())

const DEFAULT_EXPIRATION = 3600

// Get all photos
app.get('/photos', async (req, res) => {
    const albumId = req.query.albumId

    const photos = await getOrSetCache(
        `photos?albumId=${albumId}`,
        async () => {
            const { data } = await axios.get(
                'https://jsonplaceholder.typicode.com/photos',
                { params: { albumId } }
            )
            return data
        }
    )

    res.json(photos)
})

// Get individual photo
app.get('/photos/:id', async (req, res) => {
    const photo = await getOrSetCache(`photos:${req.params.id}`, async () => {
        const { data } = await axios.get(
            `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
        )
        return data
    })
    res.json(photo)
})

// Check if photos/album exists in redis database
function getOrSetCache(key, cb) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, async (e, data) => {
            if (e) return reject(e)
            if (data != null) return resolve(JSON.parse(data))

            const freshData = await cb()
            redisClient.setex(
                key,
                DEFAULT_EXPIRATION,
                JSON.stringify(freshData)
            )
            resolve(freshData)
        })
    })
}

app.listen(8000)
console.log(`Started listening at http://localhost:8000`)
