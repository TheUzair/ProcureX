from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, vendors, products, purchase_orders, audit_logs, ai

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="ProcureX API",
    description="Purchase Order Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — support comma-separated origins for production + local dev
allowed_origins = [
    origin.strip()
    for origin in settings.frontend_url.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(
    purchase_orders.router, prefix="/api/purchase-orders", tags=["Purchase Orders"]
)
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Audit Logs"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ProcureX API"}
