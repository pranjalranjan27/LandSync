# ==============================================================================
# Layer: Repositories — Users, Districts & States (app/repositories/user_repo.py)
# ALLOWED:
#   - Execute raw SQLAlchemy queries (SELECT, INSERT, UPDATE) against users, districts, states.
#   - Return model instances or None.
# NOT ALLOWED:
#   - NO business logic, NO permission checks, NO password validation logic here.
#   - NEVER import or call service layer functions from this repository.
# ==============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User, District, State


class UserRepository:
    """Raw database access queries for User, District, and State entities."""

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.get(User, user_id)

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.strip().lower())
        return db.scalars(stmt).first()

    @staticmethod
    def create_user(db: Session, user_data: dict) -> User:
        user = User(
            name=user_data["name"],
            email=user_data["email"].strip().lower(),
            hashed_password=user_data["hashed_password"],
            role=user_data["role"],
            jurisdiction_level=user_data["jurisdiction_level"],
            jurisdiction_id=user_data.get("jurisdiction_id")
        )
        db.add(user)
        db.flush()
        return user

    @staticmethod
    def get_all_users(db: Session) -> List[User]:
        stmt = select(User).order_by(User.id)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_state_by_id(db: Session, state_id: int) -> Optional[State]:
        return db.get(State, state_id)

    @staticmethod
    def get_all_states(db: Session) -> List[State]:
        stmt = select(State).order_by(State.name)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_district_by_id(db: Session, district_id: int) -> Optional[District]:
        return db.get(District, district_id)

    @staticmethod
    def get_districts_by_state(db: Session, state_id: int) -> List[District]:
        stmt = select(District).where(District.state_id == state_id).order_by(District.name)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_all_districts(db: Session) -> List[District]:
        stmt = select(District).order_by(District.name)
        return list(db.scalars(stmt).all())

    @staticmethod
    def create_state(db: Session, name: str) -> State:
        state = State(name=name)
        db.add(state)
        db.flush()
        return state

    @staticmethod
    def create_district(db: Session, name: str, state_id: int) -> District:
        district = District(name=name, state_id=state_id)
        db.add(district)
        db.flush()
        return district
