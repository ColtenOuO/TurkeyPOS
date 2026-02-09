
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
    
    access_token_expires = timedelta(minutes=60 * 24)
    access_token = create_access_token(
        data={"sub": "admin"}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
