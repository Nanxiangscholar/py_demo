import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://121.41.85.83:8001';
  const socketRef = useRef(null);

  // 游戏状态
  const [gameState, setGameState] = useState('lobby'); // lobby, waiting, playing
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [myPlayerNumber, setMyPlayerNumber] = useState(null);
  const [players, setPlayers] = useState([]);

  // 棋盘状态
  const [board, setBoard] = useState(() =>
    Array(15).fill(null).map(() => Array(15).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [message, setMessage] = useState('');

  // 初始化 WebSocket 连接
  useEffect(() => {
    socketRef.current = io(API_URL);

    socketRef.current.on('connect', () => {
      console.log('已连接到服务器');
    });

    socketRef.current.on('room_created', (data) => {
      setGameState('waiting');
      setRoomId(data.roomId);
      setMyPlayerNumber(1);
      setMessage(`房间创建成功！房间号: ${data.roomId}`);
    });

    socketRef.current.on('join_error', (data) => {
      setMessage(data.message);
    });

    socketRef.current.on('game_start', (data) => {
      setGameState('playing');
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setMyPlayerNumber(data.yourNumber);
      setPlayers(data.players);
      setWinner(null);
      setLastMove(null);
      setMessage(`游戏开始！你是${data.yourNumber === 1 ? '黑棋' : '白棋'} (${data.players[data.yourNumber - 1].name})`);
    });

    socketRef.current.on('move_made', (data) => {
      setBoard(prevBoard => {
        const newBoard = prevBoard.map(r => [...r]);
        newBoard[data.row][data.col] = data.player;
        return newBoard;
      });
      setLastMove({ row: data.row, col: data.col });

      if (data.winner) {
        setWinner(data.winner);
        setPlayers(prevPlayers => {
          const winnerName = prevPlayers[data.winner - 1]?.name || (data.winner === 1 ? '黑棋' : '白棋');
          setMessage(`🎉 ${winnerName} 获胜！`);
          return prevPlayers;
        });
      } else {
        setCurrentPlayer(data.currentPlayer);
      }
    });

    socketRef.current.on('game_restarted', (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setWinner(null);
      setLastMove(null);
      setMessage('游戏已重新开始');
    });

    socketRef.current.on('opponent_disconnected', () => {
      setMessage('对手已断开连接');
      setGameState('lobby');
    });

    socketRef.current.on('opponent_left', () => {
      setMessage('对手已离开房间');
      setGameState('lobby');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // 创建房间
  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setMessage('请输入你的名字');
      return;
    }
    socketRef.current.emit('create_room', { playerName: playerName.trim() });
  };

  // 加入房间
  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setMessage('请输入你的名字');
      return;
    }
    if (!joinRoomId.trim()) {
      setMessage('请输入房间号');
      return;
    }
    socketRef.current.emit('join_room', {
      roomId: joinRoomId.trim().toUpperCase(),
      playerName: playerName.trim()
    });
  };

  // 点击棋盘落子
  const handleCellClick = (row, col) => {
    // 检查是否可以落子
    if (gameState !== 'playing') return;
    if (board[row][col] !== 0) return;
    if (winner) return;
    if (currentPlayer !== myPlayerNumber) {
      setMessage('等待对手落子...');
      return;
    }

    // 发送落子请求
    socketRef.current.emit('make_move', { row, col });
  };

  // 重新开始
  const handleRestart = () => {
    socketRef.current.emit('restart_game');
  };

  // 离开房间
  const handleLeave = () => {
    socketRef.current.emit('leave_room');
    setGameState('lobby');
    setRoomId('');
    setMyPlayerNumber(null);
    setPlayers([]);
    setMessage('');
  };

  // 获取棋子样式
  const getCellClass = (row, col) => {
    const cellValue = board[row][col];
    let classes = 'gomoku-cell';

    if (cellValue === 1) classes += ' black';
    if (cellValue === 2) classes += ' white';

    if (lastMove && lastMove.row === row && lastMove.col === col) {
      classes += ' last-move';
    }

    return classes;
  };

  // 大厅界面
  if (gameState === 'lobby') {
    return (
      <div className="gomoku-container">
        <div className="gomoku-lobby">
          <h1>双人五子棋</h1>
          <p className="subtitle">在线对战版</p>

          {message && <div className="gomoku-message">{message}</div>}

          <div className="lobby-form">
            <input
              type="text"
              placeholder="输入你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="lobby-input"
              maxLength={10}
            />

            <div className="lobby-buttons">
              <button className="gomoku-btn" onClick={handleCreateRoom}>
                创建房间
              </button>
            </div>

            <div className="lobby-divider">或加入已有房间</div>

            <div className="lobby-join">
              <input
                type="text"
                placeholder="输入房间号"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="lobby-input"
                maxLength={8}
              />
              <button className="gomoku-btn" onClick={handleJoinRoom}>
                加入房间
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 等待界面
  if (gameState === 'waiting') {
    return (
      <div className="gomoku-container">
        <div className="gomoku-waiting">
          <h1>双人五子棋</h1>
          <div className="waiting-info">
            <p>房间号: <strong className="room-code">{roomId}</strong></p>
            <p>玩家: {playerName}</p>
            <p className="waiting-text">等待对手加入...</p>
          </div>
          <button className="gomoku-btn" onClick={handleLeave}>
            取消等待
          </button>
        </div>
      </div>
    );
  }

  // 游戏界面
  return (
    <div className="gomoku-container">
      <div className="gomoku-header">
        <div className="header-top">
          <h1>双人五子棋</h1>
          <button className="leave-btn" onClick={handleLeave}>
            退出
          </button>
        </div>

        <div className="player-info">
          <div className={`player-card ${myPlayerNumber === 1 ? 'you' : ''}`}>
            <span className="player-number">1</span>
            <span>{players[0]?.name || '玩家1'} (黑棋)</span>
          </div>
          <div className="vs">VS</div>
          <div className={`player-card ${myPlayerNumber === 2 ? 'you' : ''}`}>
            <span className="player-number">2</span>
            <span>{players[1]?.name || '玩家2'} (白棋)</span>
          </div>
        </div>

        {message && <div className="gomoku-message">{message}</div>}

        {winner ? (
          <div className="gomoku-winner">
            🎉 {players[winner - 1]?.name} ({winner === 1 ? '黑棋' : '白棋'}) 获胜！
          </div>
        ) : (
          <div className="gomoku-current">
            当前: <span className={currentPlayer === 1 ? 'black' : 'white'}>
              {currentPlayer === 1 ? '黑棋' : '白棋'}
            </span>
            {currentPlayer === myPlayerNumber && ' (你的回合)'}
          </div>
        )}
      </div>

      <div className="gomoku-board">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={getCellClass(r, c)}
              onClick={() => handleCellClick(r, c)}
              disabled={currentPlayer !== myPlayerNumber || winner}
              aria-label={`位置 ${r},${c}`}
            >
              {cell === 1 && <span className="stone black" />}
              {cell === 2 && <span className="stone white" />}
            </button>
          ))
        )}
      </div>

      <div className="gomoku-controls">
        <button className="gomoku-btn" onClick={handleRestart} disabled={!winner}>
          重新开始
        </button>
      </div>

      <div className="gomoku-footer">
        <p>房间号: {roomId}</p>
      </div>
    </div>
  );
}

export default App;