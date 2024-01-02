// const express = require('express')
import express from 'express'
const app = express()
const host = "http://localhost"
const port = process.env.port || 5000
import router from './routes/scrap.js'

app.use('/api/scrap',router)

app.listen(port,()=>{
    console.log(`Scrapper listening on ${host}:${port}`)
})
