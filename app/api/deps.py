
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.store import Store
import uuid

from app.core.security import ALGORITHM, SECRET_KEY

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/access-token")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "admin")
        if username is None or role != "admin":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

def get_current_store(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        store_id: str = payload.get("sub")
        role: str = payload.get("role")
        if store_id is None or role != "store":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Verify store exists and is active
    try:
        store_uuid = uuid.UUID(store_id)
    except ValueError:
        raise credentials_exception

    store = db.query(Store).filter(Store.id == store_uuid).first()
    if not store or not store.is_active:
        raise HTTPException(status_code=401, detail="Store inactive or not found")
        
    return store

def get_current_actor(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception

