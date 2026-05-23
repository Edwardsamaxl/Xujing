import express from 'express'
import cors from 'cors'
import narrativeRouter from './narrative/interface'
import checkInRouter from './check-in/interface'
import visitorRouter from './visitor/interface'
import rewardRouter from './reward/interface'
import summaryRouter from './summary/interface'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/narrative', narrativeRouter)
app.use('/api/check-in', checkInRouter)
app.use('/api/visitor', visitorRouter)
app.use('/api/reward', rewardRouter)
app.use('/api/summary', summaryRouter)

app.get('/api/health', (_, res) => res.json({ ok: true }))

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}
