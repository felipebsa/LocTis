from app.database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#routers
from app.routes.landlord import router as landlord_router
from app.routes.service import router as service_router
from app.routes.property import router as property_router
from app.routes.client import router as client_router
from app.routes.contract import router as contract_router

#models
from app.models.landlord import  Landlord
from app.models.service import Service
from app.models.property import Property
from app.models.client import Client
from app.models.contract import Contract

app = FastAPI()

#settings Cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

#include routers
app.include_router(landlord_router)
app.include_router(service_router)
app.include_router(property_router)
app.include_router(client_router)
app.include_router(contract_router)