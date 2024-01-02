import express from 'express'
const router = express.Router()
import scrapTest from '../controllers/scrapTest.js'
import scrapBSE from '../controllers/scrapBSE.js'
import scrapNSE from '../controllers/scrapNSE.js'

router.get('/',scrapTest)
router.get('/nse',scrapNSE)
router.get('/bse',scrapBSE)
export default router