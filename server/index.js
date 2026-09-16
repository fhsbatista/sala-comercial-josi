import { createApp } from './app.js'
import { config } from './config.js'

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nErro: a porta ${config.port} já está em uso.\n` +
      'Se o Docker estiver rodando, pare-o primeiro:\n\n' +
      '  docker compose down\n\n' +
      'Depois execute novamente: npm run dev\n',
    )
    process.exit(1)
  }
  throw err
})
