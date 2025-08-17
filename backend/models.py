from sqlalchemy import create_engine, Column, String, Numeric, Text, Date, Integer, Boolean, TIMESTAMP, ForeignKey, ARRAY, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

DATABASE_URL = "postgresql://postgres:password@localhost:5432/customer_mgmt"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class AppUser(Base):
    __tablename__ = "app_user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String)
    password_hash = Column(String, nullable=False)
    locale = Column(String, nullable=False, default='en')
    timezone = Column(String, nullable=False, default='Asia/Jerusalem')
    role = Column(String, nullable=False, default='user')
    
    # Relationships
    created_customers = relationship("Customer", back_populates="creator")
    created_meetings = relationship("Meeting", back_populates="creator")

class Customer(Base):
    __tablename__ = "customer"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    logo_url = Column(String)
    arr_usd = Column(Numeric(14, 2), default=0)
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("app_user.id", ondelete="SET NULL"))
    
    # Relationships
    creator = relationship("AppUser", back_populates="created_customers")
    contacts = relationship("Contact", back_populates="customer", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="customer", cascade="all, delete-orphan")

class Contact(Base):
    __tablename__ = "contact"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customer.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String)
    phone = Column(String)
    email = Column(String)
    
    # Relationships
    customer = relationship("Customer", back_populates="contacts")
    
    __table_args__ = (
        CheckConstraint("customer_id IS NOT NULL AND email IS NOT NULL", name="unique_customer_email"),
    )

class Meeting(Base):
    __tablename__ = "meeting"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customer.id", ondelete="CASCADE"), nullable=False)
    meeting_date = Column(Date, nullable=False)
    _title_hint = Column(String)
    raw_notes = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app_user.id", ondelete="SET NULL"))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="meetings")
    creator = relationship("AppUser", back_populates="created_meetings")
    assets = relationship("MeetingAsset", back_populates="meeting", cascade="all, delete-orphan")
    summaries = relationship("MeetingSummary", back_populates="meeting", cascade="all, delete-orphan")
    email_drafts = relationship("EmailDraft", back_populates="meeting", cascade="all, delete-orphan")
    
    @property
    def title(self):
        date_str = self.meeting_date.strftime('%Y-%m-%d')
        hint = self._title_hint.strip() if self._title_hint and self._title_hint.strip() else 'Meeting'
        return f"{date_str} – {hint}"

class MeetingAsset(Base):
    __tablename__ = "meeting_asset"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meeting.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_name = Column(String)
    uploaded_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    meeting = relationship("Meeting", back_populates="assets")
    
    __table_args__ = (
        CheckConstraint("kind IN ('image', 'file')", name="valid_asset_kind"),
    )

class MeetingSummary(Base):
    __tablename__ = "meeting_summary"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meeting.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    language = Column(String, nullable=False, default='en')
    summary_md = Column(Text, nullable=False)
    model = Column(String, nullable=False)
    prompt_template_version = Column(String)
    created_by_ai = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    # Relationships
    meeting = relationship("Meeting", back_populates="summaries")
    
    __table_args__ = (
        CheckConstraint("meeting_id IS NOT NULL AND version IS NOT NULL", name="unique_meeting_version"),
    )

class EmailDraft(Base):
    __tablename__ = "email_draft"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meeting.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    subject = Column(String, nullable=False)
    body_html = Column(Text, nullable=False)
    to_emails = Column(ARRAY(String), nullable=False)
    cc_emails = Column(ARRAY(String), default=[])
    language = Column(String, nullable=False, default='en')
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    created_by_ai = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    meeting = relationship("Meeting", back_populates="email_drafts")
    
    __table_args__ = (
        CheckConstraint("meeting_id IS NOT NULL AND version IS NOT NULL", name="unique_meeting_email_version"),
    )

def create_tables():
    Base.metadata.create_all(bind=engine)
