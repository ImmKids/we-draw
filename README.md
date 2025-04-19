# DrawTogether Server

A synchronization server for the DrawTogether collaborative drawing application with server-side drawing processing.

## Features

- Server-side drawing processing using node-canvas
- Real-time drawing synchronization across multiple clients
- Canvas state synchronization for new users joining
- Room-based collaboration (multiple drawing rooms supported)
- Event-based communication using Socket.IO
- Drawing happens on the server for consistency across all clients

## Installation

1. Install dependencies:
```
cd server
npm install
```

2. Start the server:
```
npm start
```

For development with auto-reload:
```
npm run dev
```

## Architecture

This server uses a server-side drawing approach where:

1. Clients send drawing commands to the server
2. The server executes these drawing commands on a canvas using node-canvas
3. The server periodically sends the updated canvas to all clients
4. Clients display the official canvas from the server

This approach ensures:
- All clients see exactly the same drawing
- New users get the complete canvas state immediately
- Drawing state is preserved even if all users disconnect
- Network latency doesn't affect drawing consistency

## API

The server uses Socket.IO for real-time communication with the following events:

### Client to Server

- `joinRoom(roomName)`: Join a specific drawing room
- `drawAction(data)`: Send a drawing action for the server to execute
  - For drawing: `{type: "draw", color, brushSize, x1, y1, x2, y2}`
  - For clearing: `{type: "clear"}`

### Server to Client

- `canvasState(imageData)`: Sends the complete canvas image periodically and when a client joins
- `drawAction(data)`: Broadcasts drawing actions to other clients for real-time feedback

## License

MIT

## Heroku Deployment

This application can be easily deployed to Heroku:

1. Create a Heroku account if you don't have one: [Heroku](https://signup.heroku.com/)

2. Install the Heroku CLI: [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

3. Login to Heroku CLI:
```
heroku login
```

4. Create a new Heroku app:
```
heroku create your-app-name
```

5. Push to Heroku:
```
git push heroku main
```

6. Open your deployed app:
```
heroku open
```

### Environment Variables

If needed, you can set environment variables on Heroku:
```
heroku config:set VARIABLE_NAME=value
```

### Scaling

To ensure your app is running:
```
heroku ps:scale web=1
```

### Troubleshooting

To view logs:
```
heroku logs --tail
``` 