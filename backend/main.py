from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import os

from database import get_db
from models import Customer, Contact, Meeting, MeetingAsset, MeetingSummary, EmailDraft, AppUser
from schemas import (
    CustomerCreate, CustomerResponse, CustomerUpdate,
    ContactCreate, ContactResponse, ContactUpdate,
    MeetingCreate, MeetingResponse,
    AuthLogin, AuthResponse, UserResponse
)
from auth import verify_token, get_current_user
from ai_service import generate_meeting_summary, generate_email_draft

app = FastAPI(title="Customer Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Auth endpoints
@app.post("/auth/login", response_model=AuthResponse)
async def login(credentials: AuthLogin, db: Session = Depends(get_db)):
    # TODO: Implement authentication logic
    pass

@app.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return current_user

# Customer endpoints
@app.get("/customers", response_model=List[CustomerResponse])
async def get_customers(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%"))
    customers = query.offset(offset).limit(limit).all()
    return customers

@app.post("/customers", response_model=CustomerResponse)
async def create_customer(
    customer: CustomerCreate,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_customer = Customer(**customer.dict(), created_by=current_user.id)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for field, value in customer_update.dict(exclude_unset=True).items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@app.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

# Contact endpoints
@app.post("/customers/{customer_id}/contacts", response_model=ContactResponse)
async def create_contact(
    customer_id: str,
    contact: ContactCreate,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_contact = Contact(**contact.dict(), customer_id=customer_id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

# Meeting endpoints
@app.get("/customers/{customer_id}/meetings", response_model=List[MeetingResponse])
async def get_customer_meetings(
    customer_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meetings = db.query(Meeting).filter(
        Meeting.customer_id == customer_id
    ).order_by(Meeting.meeting_date.desc()).all()
    return meetings

@app.post("/customers/{customer_id}/meetings", response_model=MeetingResponse)
async def create_meeting(
    customer_id: str,
    meeting: MeetingCreate,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_meeting = Meeting(
        **meeting.dict(),
        customer_id=customer_id,
        created_by=current_user.id
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.get("/meetings/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@app.post("/meetings/{meeting_id}/assets")
async def upload_meeting_asset(
    meeting_id: str,
    file: UploadFile = File(...),
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify meeting exists
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Save file to storage
    file_path = f"data/assets/{meeting_id}/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create asset record
    asset = MeetingAsset(
        meeting_id=meeting_id,
        kind="image" if file.content_type.startswith("image/") else "file",
        file_url=file_path,
        file_name=file.filename
    )
    db.add(asset)
    db.commit()
    
    return {"message": "Asset uploaded successfully", "asset_id": str(asset.id)}

# AI endpoints
@app.post("/meetings/{meeting_id}/ai/summarize")
async def create_ai_summary(
    meeting_id: str,
    language: str = "en",
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Get next version number
    latest_summary = db.query(MeetingSummary).filter(
        MeetingSummary.meeting_id == meeting_id
    ).order_by(MeetingSummary.version.desc()).first()
    
    next_version = (latest_summary.version + 1) if latest_summary else 1
    
    # Generate AI summary
    summary_text = await generate_meeting_summary(meeting, language)
    
    summary = MeetingSummary(
        meeting_id=meeting_id,
        version=next_version,
        language=language,
        summary_md=summary_text,
        model="gpt-4",
        prompt_template_version="v1.0"
    )
    
    db.add(summary)
    db.commit()
    db.refresh(summary)
    
    return {
        "summary_id": str(summary.id),
        "version": summary.version,
        "language": summary.language
    }

@app.post("/meetings/{meeting_id}/ai/draft-email")
async def create_email_draft(
    meeting_id: str,
    language: str = "en",
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Get next version number
    latest_draft = db.query(EmailDraft).filter(
        EmailDraft.meeting_id == meeting_id
    ).order_by(EmailDraft.version.desc()).first()
    
    next_version = (latest_draft.version + 1) if latest_draft else 1
    
    # Generate email draft
    email_content = await generate_email_draft(meeting, language)
    
    # Get customer contacts for TO/CC
    contacts = db.query(Contact).filter(
        Contact.customer_id == meeting.customer_id,
        Contact.email.isnot(None)
    ).all()
    
    to_emails = [contact.email for contact in contacts[:2]]  # First 2 as TO
    cc_emails = [contact.email for contact in contacts[2:]]  # Rest as CC
    
    draft = EmailDraft(
        meeting_id=meeting_id,
        version=next_version,
        subject=email_content["subject"],
        body_html=email_content["body"],
        to_emails=to_emails,
        cc_emails=cc_emails,
        language=language
    )
    
    db.add(draft)
    db.commit()
    db.refresh(draft)
    
    return {
        "email_draft_id": str(draft.id),
        "version": draft.version,
        "subject": draft.subject
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
