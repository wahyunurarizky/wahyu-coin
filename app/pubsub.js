const redis = require('redis')
const Blockchain = require('../blockchain')

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
}

class PubSub {
  constructor(blockchain, transactionPool, redisUrl) {
    this.blockchain = blockchain
    this.transactionPool = transactionPool

    this.publisher = redis.createClient({ url: redisUrl })
    this.subscriber = redis.createClient({ url: redisUrl })
  }

  static async init(blockchain, transactionPool, redisUrl) {
    const obj = new this(blockchain, transactionPool, redisUrl)

    await obj.publisher.connect()
    await obj.subscriber.connect()
    await obj.subscribeToChannels()

    return obj
  }

  handleMessage(message, channel) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`)

    const parsedMessage = JSON.parse(message)

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
            chain: parsedMessage
          })
        })
        break
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage)
        break
      default:
        return
    }
  }

  async subscribeToChannels() {
    this.subscriber.subscribe(
      Object.values(CHANNELS),
      this.handleMessage.bind(this)
    )
  }

  async publish({ channel, message }) {
    await this.subscriber.unsubscribe(channel)
    await this.publisher.publish(channel, message)
    await this.subscriber.subscribe(channel, this.handleMessage.bind(this))
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    })
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    })
  }
}

module.exports = PubSub
