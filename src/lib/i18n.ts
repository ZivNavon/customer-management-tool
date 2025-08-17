import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app.title": "Customer Manager",
      "nav.customers": "Customers",
      "nav.logout": "Logout",
      "search.customers": "Search customers...",
      "action.addCustomer": "Add Customer",
      "action.addMeeting": "Add Meeting",
      "action.edit": "Edit",
      "action.delete": "Delete",
      "action.save": "Save",
      "action.cancel": "Cancel",
      "action.confirm": "Confirm",
      "customer.arr": "ARR",
      "customer.lastMeeting": "Last meeting",
      "customer.name": "Customer Name",
      "customer.notes": "Notes",
      "customer.logo": "Logo",
      "meeting.title": "Meeting title",
      "meeting.date": "Meeting Date",
      "meeting.notes": "Notes",
      "meeting.assets": "Attachments",
      "meeting.summary": "Summary",
      "meeting.emailDraft": "Email Draft",
      "contact.name": "Contact Name",
      "contact.role": "Role",
      "contact.phone": "Phone",
      "contact.email": "Email",
      "ai.generateSummary": "Generate AI Summary",
      "ai.generateEmail": "Generate Email Draft",
      "ai.editBeforeSave": "Edit before save",
      "language.en": "English",
      "language.he": "עברית",
      "empty.customers": "No customers yet. Add your first customer.",
      "empty.meetings": "No meetings yet. Add your first meeting.",
      "empty.contacts": "No contacts yet. Add your first contact.",
      "confirm.delete.customer": "Are you sure you want to delete this customer?",
      "confirm.delete.meeting": "Are you sure you want to delete this meeting?",
      "confirm.delete.contact": "Are you sure you want to delete this contact?",
      "error.generic": "An error occurred. Please try again.",
      "success.saved": "Saved successfully",
      "success.deleted": "Deleted successfully"
    }
  },
  he: {
    translation: {
      "app.title": "מנהל לקוחות",
      "nav.customers": "לקוחות",
      "nav.logout": "התנתק",
      "search.customers": "חפש לקוחות...",
      "action.addCustomer": "הוסף לקוח",
      "action.addMeeting": "הוסף פגישה",
      "action.edit": "ערוך",
      "action.delete": "מחק",
      "action.save": "שמור",
      "action.cancel": "בטל",
      "action.confirm": "אשר",
      "customer.arr": "ARR",
      "customer.lastMeeting": "פגישה אחרונה",
      "customer.name": "שם הלקוח",
      "customer.notes": "הערות",
      "customer.logo": "לוגו",
      "meeting.title": "כותרת הפגישה",
      "meeting.date": "תאריך הפגישה",
      "meeting.notes": "הערות",
      "meeting.assets": "קבצים מצורפים",
      "meeting.summary": "סיכום",
      "meeting.emailDraft": "טיוטת אימייל",
      "contact.name": "שם איש הקשר",
      "contact.role": "תפקיד",
      "contact.phone": "טלפון",
      "contact.email": "אימייל",
      "ai.generateSummary": "צור סיכום בעזרת AI",
      "ai.generateEmail": "צור טיוטת אימייל בעזרת AI",
      "ai.editBeforeSave": "ערוך לפני שמירה",
      "language.en": "English",
      "language.he": "עברית",
      "empty.customers": "אין עדיין לקוחות. הוסף את הלקוח הראשון שלך.",
      "empty.meetings": "אין עדיין פגישות. הוסף את הפגישה הראשונה שלך.",
      "empty.contacts": "אין עדיין אנשי קשר. הוסף את איש הקשר הראשון שלך.",
      "confirm.delete.customer": "האם אתה בטוח שברצונך למחוק את הלקוח הזה?",
      "confirm.delete.meeting": "האם אתה בטוח שברצונך למחוק את הפגישה הזו?",
      "confirm.delete.contact": "האם אתה בטוח שברצונך למחוק את איש הקשר הזה?",
      "error.generic": "אירעה שגיאה. אנא נסה שוב.",
      "success.saved": "נשמר בהצלחה",
      "success.deleted": "נמחק בהצלחה"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
