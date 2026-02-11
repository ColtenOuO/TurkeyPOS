
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, get_password_hash
import os
from datetime import timedelta

router = APIRouter()

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD", "admin")
@router.post("/login/access-token")
def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    env_password = os.getenv("ADMIN_PASSWORD", "admin")
    
    if form_data.username != "admin":
         pass

    if form_data.password != env_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": "admin", "role": "admin"}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.store import Store

@router.post("/login/store")
def login_store(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Store Login
    Username = Store Name
    Password = Store Password
    """
    username = form_data.username
    # Fix for potential encoding issues (UTF-8 bytes interpreted as Latin-1)
    try:
        # Check if it looks like mojibake
        fixed_username = username.encode('latin-1').decode('utf-8')
        # If it changed (and didn't error), use the fixed one
        if fixed_username != username:
            username = fixed_username
    except Exception:
        pass

    store = db.query(Store).filter(Store.name == username).first()
    if not store:
        raise HTTPException(status_code=400, detail="Incorrect store name or password")
    
    if not verify_password(form_data.password, store.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect store name or password")
        
    if not store.is_active:
        raise HTTPException(status_code=400, detail="Store is inactive")
        
    access_token_expires = timedelta(minutes=60 * 24 * 7)
    access_token = create_access_token(
        data={
            "sub": str(store.id),
            "role": "store",
            "store_name": store.name
        }, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
