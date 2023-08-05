const PubNub = require('pubnub')

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
}

class PubSubWithPubNub {
  constructor({ blockchain, transactionPool, credentials }) {
    this.blockchain = blockchain
    this.transactionPool = transactionPool

    console.log(credentials)

    this.pubnub = new PubNub(credentials)
    console.log(this.pubnub)
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) })
    this.pubnub.addListener(this.listener())
  }

  handleMessage(channel, message) {
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

  listener() {
    return {
      message: (messageObject) => {
        const { channel, message } = messageObject

        this.handleMessage(channel, message)
      }
    }
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message })
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

module.exports = PubSubWithPubNub
