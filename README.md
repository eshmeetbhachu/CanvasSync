# CanvasSync

CanvasSync is a real-time collaborative whiteboard that enables multiple users to draw simultaneously on a shared canvas. The application uses **Socket.IO** for low-latency communication, **MongoDB** for persistent board storage, and **Redis with the Socket.IO Redis Adapter** to support horizontal scaling across multiple backend servers.

---

## 🚀 Features

- 🎨 Real-time collaborative drawing
- 👥 Multi-user rooms
- ✏️ Pencil tool
- 🩹 Full-stroke eraser
- ↩️ Undo / Redo synchronization
- 📍 Real-time cursor tracking
- 💾 Persistent board storage using MongoDB
- ⚡ Horizontal scaling with Redis
- 🔄 Cross-server synchronization using Socket.IO Redis Adapter

---

## 🏗️ System Architecture

```
                   Browser A
                       │
                Socket.IO Client
                       │
        ┌──────────────┴──────────────┐
        │                             │
     Backend A                  Backend B
        │                             │
        └──────── Redis Adapter ──────┘
                     │
                   Redis
                     │
                 MongoDB
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, HTML5 Canvas, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-Time | Socket.IO |
| Database | MongoDB, Mongoose |
| Scaling | Redis, Socket.IO Redis Adapter |
| Containerization | Docker |

---

## ⚙️ How It Works

### Drawing Flow

```
Mouse Input
     │
     ▼
Create Stroke
     │
     ▼
Render Locally
     │
     ▼
Emit Socket Event
     │
     ▼
Broadcast to Room
     │
     ▼
Persist in MongoDB
```

### Multi-Server Synchronization

```
User Draws
     │
     ▼
Socket.IO Server
     │
Redis Adapter
     │
Redis Pub/Sub
     │
Other Socket.IO Servers
     │
Broadcast to Connected Clients
```

---

## 📂 Project Structure

```
CanvasSync
│
├── client
│   ├── src
│   │   ├── components
│   │   ├── socket
│   │   ├── utils
│   │   └── ...
│   └── ...
│
├── server
│   ├── src
│   │   ├── config
│   │   ├── models
│   │   ├── services
│   │   ├── sockets
│   │   └── ...
│   └── ...
│
└── README.md
```

---

## 🖥️ Running Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd CanvasSync
```

### 2. Install dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

### 3. Start MongoDB

Run your MongoDB instance locally or use MongoDB Atlas.

---

### 4. Start Redis

Using Docker:

```bash
docker run --name redis -p 6379:6379 redis
```

---

### 5. Configure Environment Variables

Backend (`server/.env`)

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
```

---

### 6. Start Backend

```bash
npm run dev
```

---

### 7. Start Frontend

```bash
npm run dev
```

---

## 🧪 Horizontal Scaling Demo

Start a second backend instance.

```bash
PORT=3001 npm run dev
```

Open two browser windows:

```
http://localhost:5173?backend=3000
```

and

```
http://localhost:5173?backend=3001
```

Both users can now collaborate in the same room while connected to different backend servers.

---

## 💡 Engineering Challenges

During development, several engineering challenges were solved:

- Designed a stroke-based canvas model instead of storing pixel data.
- Built synchronized undo and redo across multiple connected clients.
- Persisted whiteboard state in MongoDB without affecting real-time collaboration.
- Implemented Redis Pub/Sub for horizontal scaling.
- Integrated the Socket.IO Redis Adapter to synchronize events across multiple backend servers.
- Replaced local room state with distributed user presence using `fetchSockets()`.

---

## 🔮 Future Improvements

- Shape tools (Rectangle, Circle, Arrow)
- Text annotations
- Authentication
- Infinite canvas
- Image uploads
- Export as PNG/PDF
- Board sharing via links
- Version history
- Mobile support

---

## 📜 License

This project is open-source and available under the MIT License.
