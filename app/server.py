from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
import os

# Get the root directory (parent of app/)
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__, 
            template_folder=os.path.join(root_dir, 'templates'),
            static_folder=os.path.join(root_dir, 'static'))
app.config['SECRET_KEY'] = 'supersecretkey'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

# Store user sessions
connected_users = {}

def broadcast_user_list():
    """Broadcast the current list of connected users to all clients"""
    user_list = list(connected_users.keys())
    emit('user_list', user_list, broadcast=True)

@socketio.on('join')
def handle_join(data):
    username = data['username']
    if username in connected_users:
        emit('error', {'message': 'Username already taken!'})
    else:
        connected_users[username] = request.sid
        send({'user': 'System', 'msg': f'{username} has joined the chat.'}, broadcast=True)
        broadcast_user_list()

@socketio.on('message')
def handle_message(data):
    user = data.get('user')
    msg = data.get('msg')
    if user and msg:
        print(f'{user}: {msg}')
        send({'user': user, 'msg': msg}, broadcast=True)
    else:
        emit('error', {'message': 'Invalid message data!'})

@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicator events"""
    user = data.get('user')
    if user:
        # Broadcast typing indicator to all other users
        emit('typing', {'user': user}, skip_sid=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    for username, sid in connected_users.items():
        if sid == request.sid:
            send({'user': 'System', 'msg': f'{username} has left the chat.'}, broadcast=True)
            del connected_users[username]
            broadcast_user_list()
            break

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get("PORT", 10000)), debug=True, allow_unsafe_werkzeug=True)


