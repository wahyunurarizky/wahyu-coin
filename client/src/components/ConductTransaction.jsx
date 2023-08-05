import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import Form from 'react-bootstrap/Form'
import { Link, redirect } from 'react-router-dom'
import { withRouter } from './withRouter'

class ConductTransaction extends Component {
  state = { recipient: '', amount: 0, knownAddresses: [] }

  componentDidMount() {
    fetch(`${document.location.origin}/api/known-addresses`)
      .then((response) => response.json())
      .then((json) => this.setState({ knownAddresses: json }))
  }

  updateRecipient = (event) => {
    this.setState({ recipient: event.target.value })
  }
  updateAmount = (event) => {
    this.setState({ amount: Number(event.target.value) })
  }

  conductTransaction = () => {
    const { recipient, amount } = this.state

    fetch(`${document.location.origin}/api/transact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, amount })
    })
      .then((response) => response.json())
      .then((json) => {
        alert(json.message || json.type)
        this.props.router.navigate('/transaction-pool')
      })
  }

  render() {
    return (
      <div className="ConductTransaction container">
        <Link to={'/'}>Home</Link>
        <h3>Conduct a transaction</h3>
        <br />
        <h4>Known Addresses</h4>
        {this.state.knownAddresses.map((knownAddress) => {
          return (
            <div key={knownAddress}>
              <div>{knownAddress}</div>
              <br />
            </div>
          )
        })}
        <Form.Group className="mb-3">
          <Form.Control
            inputMode="text"
            placeholder="recipient"
            value={this.state.recipient}
            onChange={this.updateRecipient}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Control
            inputMode="numeric"
            placeholder="amount"
            value={this.state.amount}
            onChange={this.updateAmount}
          />
        </Form.Group>
        <div>
          <Button variant="danger" size="sm" onClick={this.conductTransaction}>
            SUBMIT
          </Button>
        </div>
      </div>
    )
  }
}

export default withRouter(ConductTransaction)
