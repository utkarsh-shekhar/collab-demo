import React from 'react';
import io from 'socket.io-client';
import ReactQuill from 'react-quill';
import { SIGABRT } from 'constants';

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
    if(!this.state.disabled) return;

    this.client.emit("message", {
      type: "lock",
      lockAcquiredBy: this.props.user
    });
    // this.textArea.current.focus();
    this.setState({ disabled: false, lockAcquiredBy: this.props.user });
  }

  onContentChange(text) {
    if(this.state.lockAcquiredBy !== this.props.user) return;
    this.client.emit("message", {
      type: "contentChange",
      lastChangedByUser: this.props.user,
      text
    });
    this.setState({
      lastChangedByUser: "You",
      text
    });
  }

  onMessage(message) {
    console.log(message);
    if(message.type === "init") {
      this.setState({... message});
    } if(message.type === "lock" && message.lockAcquiredBy !== this.props.user) {
      this.setState({ disabled: true, lockAcquiredBy: message.lockAcquiredBy });
    } else if(message.type === "contentChange" && message.lastChangedByUser !== this.props.user) {
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
        <div style={{height: "25px", width: "100%"}}>
          {this.state.lockAcquiredBy ? 
            <span style={{float: "left"}}>Lock acquired by: {this.state.lockAcquiredBy === this.props.user ? "You" : this.state.lockAcquiredBy}</span>
            :
            <span style={{float: "left"}}>No one currently working on this. Acquire lock to start.</span>
          }
          {
            this.state.lastChangedByUser &&
              <span style={{float: "right"}}>Last changed by: {this.state.lastChangedByUser} </span>
          }
        </div>
        <ReactQuill
          value={this.state.text}
          onChange={this.onContentChange}
          onFocus={this.onClick}
          readOnly={this.state.disabled} />
        <p></p>
        <span style={{fontSize: "12px"}}>The board state will be destroyed when there are no more users connected to the board</span>
      </div>
    );
  }
}

export default Board;
