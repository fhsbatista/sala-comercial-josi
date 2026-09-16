import { Router } from 'express'
import { getLoadCoordinates } from '../config.js'
import { META } from '../../src/data/imoveis.js'

const router = Router()

router.get('/', (_req, res) => {
  const loadCoordinates = getLoadCoordinates()

  res.json({
    data: {
      referencia: META.referencia,
      loadCoordinates,
    },
  })
})

export default router
