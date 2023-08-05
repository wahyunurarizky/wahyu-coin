import React, { Component } from 'react'
import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'

export default class App extends Component {
  state = { walletInfo: { address: '', balance: 0 } }

  componentDidMount() {
    fetch(`${document.location.origin}/api/wallet-info`)
      .then((response) => response.json())
      .then((json) => {
        this.setState({ walletInfo: json })
      })
  }

  render() {
    const { address, balance } = this.state.walletInfo

    return (
      <div className="App container">
        <div className="row">
          <div className="col-12 text-center">
            <img className="logo img-thumbnail" src={logo}></img>
            <br />
            <div>Welcome to the blockchain...</div>
            <br />
            <div>
              <Link to="/blocks">Blocks</Link>
            </div>
            <div>
              <Link to="/conduct-transaction">Conduct a transaction</Link>
            </div>
            <div>
              <Link to="/transaction-pool">Transaction Pool</Link>
            </div>

            <br />
            <div className="WalletInfo">
              <div>Address: {address}</div>
              <div>Balance: {balance}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
