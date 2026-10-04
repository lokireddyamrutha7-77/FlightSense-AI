from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import logging
from backend.app.core.config import settings

logger = logging.getLogger("DatabaseSession")

def create_db_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite"):
        logger.info("Connecting to SQLite database fallback...")
        return create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    
    try:
        logger.info("Connecting to MySQL database server...")
        eng = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20
        )
        with eng.connect() as conn:
            pass
        logger.info("Successfully connected to MySQL database.")
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to MySQL database: {e}. Falling back to SQLite.")
        fallback_url = "sqlite:///./flightsense.db"
        return create_engine(fallback_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)

engine = create_db_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for yielding DB sessions in API endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes database tables if they do not exist and applies schema migrations."""
    try:
        from backend.app.db.models import Base as ModelsBase
        ModelsBase.metadata.create_all(bind=engine)
        
        # Execute safe migrations for existing tables
        with engine.connect() as conn:
            from sqlalchemy import text
            # Ensure prediction_history has user_id column
            try:
                conn.execute(text("ALTER TABLE prediction_history ADD COLUMN user_id INTEGER;"))
                conn.commit()
            except Exception:
                pass  # Already exists or dialect handled
            
            # Ensure users has phone_number, email_verified, phone_verified
            for col_sql in [
                "ALTER TABLE users ADD COLUMN phone_number VARCHAR(50);",
                "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;",
                "ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0;"
            ]:
                try:
                    conn.execute(text(col_sql))
                    conn.commit()
                except Exception:
                    pass

        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")


