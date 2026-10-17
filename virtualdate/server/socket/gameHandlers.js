// In-memory game state for tic-tac-toe
const ticTacToeGames = new Map();

const handleGame = (socket, io) => {
  // Load external game URL
  socket.on('game:load', ({ roomId, url, type }) => {
    if (!roomId) return;
    io.to(roomId).emit('game:loaded', { url, type: type || 'embed' });
  });

  // Tic-Tac-Toe
  socket.on('ttt:start', ({ roomId }) => {
    ticTacToeGames.set(roomId, {
      board: Array(9).fill(null),
      xIsNext: true,
      winner: null,
    });
    io.to(roomId).emit('ttt:state', ticTacToeGames.get(roomId));
  });

  socket.on('ttt:move', ({ roomId, index }) => {
    const game = ticTacToeGames.get(roomId);
    if (!game || game.winner || game.board[index]) return;

    game.board[index] = game.xIsNext ? 'X' : 'O';
    game.winner = calculateWinner(game.board);
    game.xIsNext = !game.xIsNext;

    io.to(roomId).emit('ttt:state', game);
  });

  socket.on('ttt:reset', ({ roomId }) => {
    ticTacToeGames.set(roomId, {
      board: Array(9).fill(null),
      xIsNext: true,
      winner: null,
    });
    io.to(roomId).emit('ttt:state', ticTacToeGames.get(roomId));
  });
};

const calculateWinner = (board) => {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(Boolean)) return 'Draw';
  return null;
};

module.exports = { handleGame };
