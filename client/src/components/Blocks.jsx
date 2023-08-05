import React, { Component } from 'react'
import Block from './Block'
import { Link } from 'react-router-dom'

export default class Blocks extends Component {
  state = { blocks: [] }

  componentDidMount() {
    fetch('http://localhost:3000/api/blocks')
      .then((response) => response.json())
      .then((json) => {
        this.setState({ blocks: json })
      })
  }
  render() {
    return (
      <div>
        <div>
          <Link to="/">Home</Link>
        </div>

        <h3>Blocks</h3>
        {this.state.blocks.map((block) => (
          <Block key={block.hash} block={block} />
        ))}
      </div>
    )
  }
}
