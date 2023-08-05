const express = require('express')
const Blockchain = require('./blockchain')
const PubSub = require('./app/pubsub')
const axios = require('axios')
const TransactionPool = require('./wallet/transaction-pool')
const Wallet = require('./wallet')
const TransactionMiner = require('./app/transaction-miner')
const path = require('path')
const cors = require('cors')
const PubSubWithPubNub = require('./app/pubnub')

const isDevelopment = process.env.ENV === 'development'

if (isDevelopment) {
  require('dotenv').config({ path: path.resolve(__dirname, '.env.local') })
} else {
  require('dotenv').config({ path: path.resolve(__dirname, '.env.prod') })
}

const DEFAULT_PORT = process.env.PORT
const ROOT_NODE_ADDRESS = isDevelopment
  ? `http://localhost:${DEFAULT_PORT}`
  : process.env.APP_URL
const REDIS_URL = process.env.REDIS_URL
const REALTIME_PLATFORM = process.env.REALTIME_PLATFORM || 'redis'

;(async () => {
  const blockchain = new Blockchain()
  const transactionPool = new TransactionPool()
  const wallet = new Wallet()
  let pubsub
  if (REALTIME_PLATFORM === 'redis') {
    pubsub = await PubSub.init(blockchain, transactionPool, REDIS_URL)
  } else {
    const credentialPubnub = {
      publishKey: process.env.PUBLISH_KEY,
      subscribeKey: process.env.SUBSCRIBE_KEY,
      secretKey: process.env.SECRET_KEY,
      userId: 'wkwkwkwkwkw'
    }
    pubsub = new PubSubWithPubNub({
      blockchain,
      transactionPool,
      credentials: credentialPubnub
    })
  }
  const transactionMiner = new TransactionMiner({
    blockchain,
    transactionPool,
    wallet,
    pubsub
  })

  const app = express()
  app.use(express.json())
  app.use(express.static(path.join(__dirname, 'client', 'dist')))
  app.use(cors())

  const syncChains = async () => {
    try {
      const result = await axios.get(ROOT_NODE_ADDRESS + '/api/blocks')
      blockchain.replaceChain(result.data)
      console.log('replace chain with', result.data)

      const result2 = await axios.get(
        ROOT_NODE_ADDRESS + '/api/transaction-pool-map'
      )
      transactionPool.setMap(result2.data)
      console.log('replace transaction pool map with', result2.data)
    } catch (err) {
      console.error(err)
    }
  }

  app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain)
  })

  app.post('/api/mine', (req, res) => {
    const { data } = req.body
    blockchain.addBlock({ data })

    pubsub.broadcastChain()

    res.json({ transaction })
  })

  app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body
    let transaction = transactionPool.existingTransaction({
      inputAddress: wallet.publicKey
    })
    try {
      if (transaction) {
        transaction.update({ senderWallet: wallet, recipient, amount })
      } else {
        transaction = wallet.createTransaction({
          recipient,
          amount,
          chain: blockchain.chain
        })
      }
    } catch (error) {
      return res.status(400).json({ type: 'error', message: error.message })
    }

    transactionPool.setTransaction(transaction)

    pubsub.broadcastTransaction(transaction)

    res.json({ type: 'success', transaction })
  })

  app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap)
  })

  app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions()

    res.redirect('/api/blocks')
  })

  app.get('/api/wallet-info', (req, res) => {
    res.json({
      address: wallet.publicKey,
      balance: Wallet.calculateBalance({
        chain: blockchain.chain,
        address: wallet.publicKey
      })
    })
  })

  app.get('/api/known-addresses', (req, res) => {
    const addressMap = {}

    for (let block of blockchain.chain) {
      for (let transaction of block.data) {
        const recipient = Object.keys(transaction.outputMap)

        recipient.forEach((recipient) => (addressMap[recipient] = recipient))
      }
    }

    res.json(Object.keys(addressMap))
  })

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
  })

  app.use((err, req, res, next) => {
    return res.status(400).json({ status: 'error', message: err.message })
  })

  // if (isDevelopment) {
  //   const walletFoo = new Wallet()
  //   const walletBar = new Wallet()

  //   const generateWalletTransaction = ({ wallet, recipient, amount }) => {
  //     const transaction = wallet.createTransaction({
  //       recipient,
  //       amount,
  //       chain: blockchain.chain
  //     })

  //     transactionPool.setTransaction(transaction)
  //   }

  //   const walletAction = () =>
  //     generateWalletTransaction({
  //       wallet,
  //       recipient: walletFoo.publicKey,
  //       amount: 5
  //     })

  //   const walletFooAction = () =>
  //     generateWalletTransaction({
  //       wallet: walletFoo,
  //       recipient: walletBar.publicKey,
  //       amount: 10
  //     })

  //   const walletBarAction = () =>
  //     generateWalletTransaction({
  //       wallet: walletBar,
  //       recipient: wallet.publicKey,
  //       amount: 15
  //     })

  //   for (let i = 0; i < 10; i++) {
  //     if (i % 3 === 0) {
  //       walletAction()
  //       walletFooAction()
  //     } else if (i % 3 === 1) {
  //       walletAction()
  //       walletBarAction()
  //     } else {
  //       walletFooAction()
  //       walletBarAction()
  //     }

  //     transactionMiner.mineTransactions()
  //   }
  // }

  const PORT =
    process.env.PEER === 'true'
      ? DEFAULT_PORT + Math.ceil(Math.random() * 1000)
      : DEFAULT_PORT
  app.listen(PORT, async () => {
    console.log(`listening on localhost:${PORT}`)
    if (PORT !== DEFAULT_PORT) {
      await syncChains()
    }
  })
})()
