import { Router } from 'express'
import { getLoadCoordinates } from '../config.js'
import { META } from '../../src/data/imoveis.js'

const router = Router()

router.get('/', (_req, res) => {
  const loadCoordinates = getLoadCoordinates()

  res.json({
    data: {
      dataBase: META.dataBase,
      referencia: META.referencia,
      interesseSecundario: META.interesseSecundario,
      loadCoordinates,
    },
  })
})

export default router
