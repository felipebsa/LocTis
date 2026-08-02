from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#routers
from routes.landlord import router as landlord_router
from routes.service import router as service_router
from routes.property import router as property_router
from routes.client import router as client_router
from routes.contract import router as contract_router

#models
from models.landlord import  Landlord
from models.service import Service
from models.property import Property
from models.client import Client
from models.contract import Contract

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