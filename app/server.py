from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import os


app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

# Store user sessions
connected_users = {}

@socketio.on('join')
def handle_join(data):
    username = data['username']
    if username in connected_users:
        emit('error', {'message': 'Username already taken!'})
    else:
        connected_users[username] = request.sid
        send({'user': 'System', 'msg': f'{username} has joined the chat.'}, broadcast=True)

@socketio.on('message')
def handle_message(data):
    user = data.get('user')
    msg = data.get('msg')
    if user and msg:
        print(f'{user}: {msg}')
        send({'user': user, 'msg': msg}, broadcast=True)
    else:
        emit('error', {'message': 'Invalid message data!'})

@socketio.on('disconnect')
def handle_disconnect():
    for username, sid in connected_users.items():
        if sid == request.sid:
            send({'user': 'System', 'msg': f'{username} has left the chat.'}, broadcast=True)
            del connected_users[username]
            break

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get("PORT", 10000)), debug=True, allow_unsafe_werkzeug=True)


