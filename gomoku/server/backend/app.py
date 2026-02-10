"""
五子棋后端服务 - WebSocket 在线双人对战版
使用 Flask-SocketIO 实现实时通信
"""
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gomoku-secret-key'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 房间存储: { room_id: { 'players': [sid1, sid2], 'board': [...], 'current': 1, 'winner': None } }
games = {}
# 玩家到房间的映射: { sid: room_id }
player_rooms = {}
# 等待中的房间(只有一个玩家)
waiting_rooms = {}


def create_empty_board():
    """创建空棋盘"""
    return [[0 for _ in range(15)] for _ in range(15)]


def check_winner(board, row, col, player):
    """检查是否获胜"""
    directions = [(0, 1), (1, 0), (1, 1), (1, -1)]

    for dr, dc in directions:
        count = 1

        r, c = row + dr, col + dc
        while 0 <= r < 15 and 0 <= c < 15 and board[r][c] == player:
            count += 1
            r += dr
            c += dc

        r, c = row - dr, col - dc
        while 0 <= r < 15 and 0 <= c < 15 and board[r][c] == player:
            count += 1
            r -= dr
            c -= dc

        if count >= 5:
            return True

    return False


@app.route('/')
def index():
    return {'status': 'ok', 'service': 'gomoku-websocket-backend'}


@socketio.on('connect')
def on_connect():
    print(f'客户端连接: {request.sid}')


@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    print(f'客户端断开: {sid}')

    # 如果玩家在房间中，处理断开
    if sid in player_rooms:
        room_id = player_rooms[sid]

        if room_id in games:
            game = games[room_id]
            # 通知对手对手已断开
            opponent_sid = None
            for p in game['players']:
                if p != sid:
                    opponent_sid = p
                    break

            if opponent_sid:
                socketio.emit('opponent_disconnected', room=opponent_sid)

            # 清理房间
            del games[room_id]

        if room_id in waiting_rooms:
            del waiting_rooms[room_id]

        del player_rooms[sid]


@socketio.on('create_room')
def on_create_room(data):
    """创建房间"""
    sid = request.sid
    player_name = data.get('playerName', f'玩家{sid[:4]}')

    # 生成唯一房间号
    room_id = str(uuid.uuid4())[:8].upper()

    # 初始化游戏
    games[room_id] = {
        'players': [sid],
        'playerNames': {sid: player_name},
        'board': create_empty_board(),
        'current': 1,
        'winner': None
    }

    waiting_rooms[room_id] = sid
    player_rooms[sid] = room_id

    join_room(room_id)

    emit('room_created', {
        'roomId': room_id,
        'playerName': player_name,
        'playerNumber': 1
    })

    print(f'房间创建: {room_id}, 玩家: {player_name}')


@socketio.on('join_room')
def on_join_room(data):
    """加入房间"""
    sid = request.sid
    room_id = data.get('roomId', '').upper()
    player_name = data.get('playerName', f'玩家{sid[:4]}')

    if room_id not in waiting_rooms:
        emit('join_error', {'message': '房间不存在或已满'})
        return

    # 加入房间
    game = games[room_id]
    game['players'].append(sid)
    game['playerNames'][sid] = player_name
    player_rooms[sid] = room_id

    join_room(room_id)

    # 移出等待列表
    del waiting_rooms[room_id]

    # 通知双方游戏开始
    socketio.emit('game_start', {
        'roomId': room_id,
        'players': [
            {'number': 1, 'name': game['playerNames'][game['players'][0]]},
            {'number': 2, 'name': player_name}
        ],
        'yourNumber': 2,
        'board': game['board'],
        'currentPlayer': 1
    }, room=sid)

    socketio.emit('game_start', {
        'roomId': room_id,
        'players': [
            {'number': 1, 'name': game['playerNames'][game['players'][0]]},
            {'number': 2, 'name': player_name}
        ],
        'yourNumber': 1,
        'board': game['board'],
        'currentPlayer': 1
    }, room=game['players'][0])

    print(f'玩家加入: {room_id}, 玩家: {player_name}')


@socketio.on('make_move')
def on_make_move(data):
    """落子"""
    sid = request.sid
    room_id = player_rooms.get(sid)

    if not room_id or room_id not in games:
        return

    game = games[room_id]

    # 检查是否轮到该玩家
    player_number = game['players'].index(sid) + 1
    if player_number != game['current']:
        return

    # 检查游戏是否已结束
    if game['winner']:
        return

    row = data.get('row')
    col = data.get('col')

    # 检查位置是否为空
    if game['board'][row][col] != 0:
        return

    # 落子
    game['board'][row][col] = player_number

    # 检查是否获胜
    is_winner = check_winner(game['board'], row, col, player_number)

    if is_winner:
        game['winner'] = player_number
        # 通知双方游戏结束
        socketio.emit('move_made', {
            'row': row,
            'col': col,
            'player': player_number,
            'winner': player_number
        }, room=room_id)
    else:
        # 切换玩家
        game['current'] = 2 if game['current'] == 1 else 1
        # 通知双方落子
        socketio.emit('move_made', {
            'row': row,
            'col': col,
            'player': player_number,
            'currentPlayer': game['current'],
            'winner': None
        }, room=room_id)


@socketio.on('restart_game')
def on_restart():
    """重新开始"""
    sid = request.sid
    room_id = player_rooms.get(sid)

    if not room_id or room_id not in games:
        return

    game = games[room_id]
    game['board'] = create_empty_board()
    game['current'] = 1
    game['winner'] = None

    socketio.emit('game_restarted', {
        'board': game['board'],
        'currentPlayer': 1
    }, room=room_id)


@socketio.on('leave_room')
def on_leave():
    """离开房间"""
    sid = request.sid
    room_id = player_rooms.get(sid)

    if room_id and room_id in games:
        leave_room(room_id)

        # 通知对手
        game = games[room_id]
        for p in game['players']:
            if p != sid:
                socketio.emit('opponent_left', room=p)
                break

        # 清理
        del games[room_id]
        if room_id in waiting_rooms:
            del waiting_rooms[room_id]
        del player_rooms[sid]


if __name__ == '__main__':
    print('五子棋服务器启动...')
    print('WebSocket 服务器运行在端口 8001')
    socketio.run(app, host='0.0.0.0', port=8001, debug=False, allow_unsafe_werkzeug=True)