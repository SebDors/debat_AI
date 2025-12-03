import os
import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

# Load environment variables
load_dotenv()

# --- Database Setup ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db/debatai")
pool = None

async def get_pool():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool

# --- Pydantic Models ---
class User(BaseModel):
    id: int
    username: str

class Debate(BaseModel):
    id: int
    topic: str

class Message(BaseModel):
    id: int
    content: str
    user_id: int
    debate_id: int
    username: str # Joined from users table

class MessageIn(BaseModel):
    content: str
    username: str # We'll use username to find/create user

class DebateIn(BaseModel):
    topic: str


# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, debate_id: int):
        await websocket.accept()
        if debate_id not in self.active_connections:
            self.active_connections[debate_id] = []
        self.active_connections[debate_id].append(websocket)

    def disconnect(self, websocket: WebSocket, debate_id: int):
        if debate_id in self.active_connections:
            self.active_connections[debate_id].remove(websocket)

    async def broadcast(self, message: dict, debate_id: int):
        if debate_id in self.active_connections:
            for connection in self.active_connections[debate_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# --- FastAPI App ---
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
async def startup():
    await get_pool()

@app.on_event("shutdown")
async def shutdown():
    global pool
    if pool:
        await pool.close()

# --- API Endpoints ---
@app.get("/api/debates", response_model=List[Debate])
async def get_debates():
    db_pool = await get_pool()
    async with db_pool.acquire() as connection:
        rows = await connection.fetch("SELECT id, topic FROM debates ORDER BY created_at DESC")
        return [Debate(id=row['id'], topic=row['topic']) for row in rows]

@app.post("/api/debates", response_model=Debate, status_code=201)
async def create_debate(debate_in: DebateIn):
    db_pool = await get_pool()
    async with db_pool.acquire() as connection:
        row = await connection.fetchrow(
            "INSERT INTO debates (topic) VALUES ($1) RETURNING id, topic",
            debate_in.topic
        )
        return Debate(id=row['id'], topic=row['topic'])

@app.get("/api/debates/{debate_id}/messages", response_model=List[Message])
async def get_messages(debate_id: int):
    db_pool = await get_pool()
    async with db_pool.acquire() as connection:
        rows = await connection.fetch(
            """
            SELECT m.id, m.content, m.user_id, m.debate_id, u.username
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.debate_id = $1
            ORDER BY m.created_at ASC
            """,
            debate_id
        )
        return [Message(**row) for row in rows]

@app.post("/api/debates/{debate_id}/messages", response_model=Message)
async def create_message(debate_id: int, message_in: MessageIn):
    db_pool = await get_pool()
    async with db_pool.acquire() as connection:
        async with connection.transaction():
            # Find or create user
            user = await connection.fetchrow("SELECT id FROM users WHERE username = $1", message_in.username)
            if user:
                user_id = user['id']
            else:
                user_id = await connection.fetchval("INSERT INTO users (username) VALUES ($1) RETURNING id", message_in.username)

            # Insert message
            inserted_message = await connection.fetchrow(
                """
                INSERT INTO messages (content, user_id, debate_id)
                VALUES ($1, $2, $3)
                RETURNING id, content, user_id, debate_id
                """,
                message_in.content, user_id, debate_id
            )
            
            # Construct the full message object to broadcast
            full_message = Message(
                id=inserted_message['id'],
                content=inserted_message['content'],
                user_id=inserted_message['user_id'],
                debate_id=inserted_message['debate_id'],
                username=message_in.username
            )

            # Broadcast the new message to all connected clients in the debate
            await manager.broadcast(full_message.model_dump(), debate_id)
            
            return full_message

# --- WebSocket Endpoint ---
@app.websocket("/ws/debates/{debate_id}")
async def websocket_endpoint(websocket: WebSocket, debate_id: int):
    await manager.connect(websocket, debate_id)
    try:
        while True:
            # Keep the connection alive by waiting for messages.
            # We don't do anything with the received data in this simple case.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, debate_id)
        print(f"Client disconnected from debate {debate_id}")

@app.get("/")
def read_root():
    return {"status": "Backend is running"}