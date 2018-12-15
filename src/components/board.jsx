import React from 'react';
import io from 'socket.io-client';

class Board extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      disabled: true,
      text: "",
      lastChangedByUser: null,
      lockAcquiredBy: null
    }
    this.textArea = React.createRef();
    this.onMessage = this.onMessage.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  onClick() {
    console.log("clicked")
    this.client.emit("message", {
      type: "lock",
      lockAcquiredBy: this.props.user
    });
    this.textArea.current.focus();
    this.setState({ disabled: false, lockAcquiredBy: this.props.user });
  }

  onContentChange(event) {
    let text = event.target.value;
    this.client.emit("message", {
      type: "contentChange",
      lastChangedByUser: this.props.user,
      text
    });
    this.setState({text})
  }

  onMessage(message) {
    console.log(message);
    if(message.type === "init") {
      this.setState({... message});
    } if(message.type === "lock" && message.lockAcquiredBy !== this.props.user) {
      this.setState({ disabled: true, lockAcquiredBy: message.lockAcquiredBy });
    } else if(message.type === "contentChange") {
      this.setState({
        text: message.text,
        lastChangedByUser: message.lastChangedByUser === this.props.user ? "you" :  message.lastChangedByUser
      })
    }
  }

  componentDidMount() {
    const serverUrl = window.location.host;
    this.client = io.connect(serverUrl);
    this.client.emit('subscribe', this.props.board);
    this.client.on("message", this.onMessage);
    window.addEventListener('unload', function(event) {
      this.client.emit("message", {
        type: "lock",
        lockAcquiredBy: null
      });
    }.bind(this));
  }

  componentWillUnmount() {
    this.client.emit('unsubscribe', {
      board: this.props.board,
      user: this.props.user
    });
  }

  render() {
    return (
      <div>
        <p>Board: {this.props.board} </p>
        {
          this.state.lastChangedByUser &&
            <p>Last changed by: {this.state.lastChangedByUser} </p>
        }
        <p>
          {this.state.lockAcquiredBy ? 
            <span>Lock acquired by: {this.state.lockAcquiredBy === this.props.user ? "You" : this.state.lockAcquiredBy}</span>
            :
            <span>No one currently working on this. Acquire lock to start.</span>
          }
        </p>
        <textarea
          rows={25}
          cols={50}
          value={this.state.text}
          disabled={this.state.disabled}
          onChange={this.onContentChange}
          ref={this.textArea}
        >
        </textarea>
        <p></p>
        <button disabled={this.state.lockAcquiredBy === this.props.user} onClick={this.onClick}>Get lock</button>
      </div>
    );
  }
}

export default Board;
