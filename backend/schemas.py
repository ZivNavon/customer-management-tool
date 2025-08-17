from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# Auth schemas
class AuthLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: 'UserResponse'

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    locale: str
    timezone: str
    role: str
    
    class Config:
        from_attributes = True

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    arr_usd: Optional[Decimal] = 0
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    arr_usd: Optional[Decimal] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime
    last_meeting_date: Optional[date] = None
    contacts_count: Optional[int] = 0
    meetings_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

# Contact schemas
class ContactBase(BaseModel):
    name: str
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class ContactResponse(ContactBase):
    id: str
    customer_id: str
    
    class Config:
        from_attributes = True

# Meeting schemas
class MeetingBase(BaseModel):
    meeting_date: date
    title_hint: Optional[str] = None
    raw_notes: Optional[str] = None

class MeetingCreate(MeetingBase):
    pass

class MeetingUpdate(BaseModel):
    title_hint: Optional[str] = None
    raw_notes: Optional[str] = None

class AssetResponse(BaseModel):
    id: str
    kind: str
    file_url: str
    file_name: Optional[str]
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class SummaryResponse(BaseModel):
    id: str
    version: int
    language: str
    summary_md: str
    model: str
    created_by_ai: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class EmailDraftResponse(BaseModel):
    id: str
    version: int
    subject: str
    body_html: str
    to_emails: List[str]
    cc_emails: List[str]
    language: str
    created_by_ai: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class MeetingResponse(MeetingBase):
    id: str
    customer_id: str
    title: str
    created_at: datetime
    assets: List[AssetResponse] = []
    summaries: List[SummaryResponse] = []
    email_drafts: List[EmailDraftResponse] = []
    
    class Config:
        from_attributes = True

# Update forward references
AuthResponse.model_rebuild()
CustomerResponse.model_rebuild()
MeetingResponse.model_rebuild()
