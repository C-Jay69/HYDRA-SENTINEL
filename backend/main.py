
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from typing import Dict, List

# Import your routers
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.monitoring import router as monitoring_router
from routes.admin import router as admin_router
from routes.security import router as security_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Rate Limiting ---
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="GuardianApp API",
    description="API for the ParentGuard parental monitoring application.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Be more specific in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, child_id: str, websocket: WebSocket):
        await websocket.accept()
        if child_id not in self.active_connections:
            self.active_connections[child_id] = []
        self.active_connections[child_id].append(websocket)
        logger.info(f"New WebSocket connection for child {child_id}")

    def disconnect(self, child_id: str, websocket: WebSocket):
        if child_id in self.active_connections:
            self.active_connections[child_id].remove(websocket)
            if not self.active_connections[child_id]:
                del self.active_connections[child_id]
            logger.info(f"WebSocket disconnected for child {child_id}")

    async def broadcast(self, child_id: str, message: str):
        if child_id in self.active_connections:
            for connection in self.active_connections[child_id]:
                await connection.send_text(message)

manager = ConnectionManager()
app.state.ws_manager = manager # Attach manager to app state

# --- WebSocket Endpoint ---
@app.websocket("/ws/location/{child_id}")
@limiter.limit("100/minute")
async def websocket_endpoint(websocket: WebSocket, child_id: str, request: Request):
    await limiter.check(request)
    # The manager is now accessible via app.state.ws_manager
    await app.state.ws_manager.connect(child_id, websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        app.state.ws_manager.disconnect(child_id, websocket)

# --- API Routers ---
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    try:
        await limiter.check(request)
    except RateLimitExceeded as e:
        return _rate_limit_exceeded_handler(request, e)
    response = await call_next(request)
    return response

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(monitoring_router)
app.include_router(admin_router)
app.include_router(security_router)

@app.get("/")
@limiter.limit("100/minute")
async def root(request: Request):
    return {"message": "GuardianApp API is running."}
