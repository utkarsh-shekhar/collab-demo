import React from 'react';
import Board from './board.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      board: null,
      user: null,
      selectedUser: false,
      selectedBoard: false,
    }

    this.userField = React.createRef();
    this.boardField = React.createRef();
    this.selectUser = this.selectUser.bind(this);
    this.selectBoard = this.selectBoard.bind(this);
  }

  selectUser() {
    let user = this.userField.current.value;
    if(user.trim === "") return;

    this.setState({
      user,
      selectedUser: true
    })
  }

  selectBoard() {
    let board = this.boardField.current.value;
    if(board.trim === "") return;

    this.setState({
      board,
      selectedBoard: true
    })
  }

  render() {
    return (
      <div>
        {
          !this.state.selectedUser &&
            <>
            <span>Enter your username:</span><input ref={this.userField} />
            <button onClick={this.selectUser}> Next </button>
            </>
        }
        {
          this.state.selectedUser && !this.state.selectedBoard &&
            <>
              <span>Go to the board:</span><input ref={this.boardField} />
            <button onClick={this.selectBoard}> Next </button>
            </>
        }
        {
          this.state.selectedUser && this.state.selectedBoard &&
            <Board {...this.state}/>
        }
      </div>
    );
  }
}

export default App;
