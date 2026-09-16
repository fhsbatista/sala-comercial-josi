import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { config } from './config.js'
import { getDb } from './db.js'
import { runMigrations } from './migrate.js'
import { runSeed } from './seed.js'
import propertiesRouter from './routes/properties.js'
import configRouter from './routes/config.js'

export function createApp({ setupDb = true } = {}) {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '100kb' }))

  if (setupDb) {
    runMigrations(getDb())
    runSeed(getDb())
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/config', configRouter)
  app.use('/api/properties', propertiesRouter)

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })

  if (config.isProduction) {
    const distPath = path.join(config.rootDir, 'dist')
    app.use(express.static(distPath))

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use((err, _req, res) => {
    console.error(err)
    res.status(500).json({ error: 'Erro interno do servidor' })
  })

  return app
}
