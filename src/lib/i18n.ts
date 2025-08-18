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
      "action.export": "Export",
      "action.import": "Import",
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
      "meeting.language": "Meeting Language",
      "meeting.participants": "Participants",
      "meeting.location": "Location",
      "meeting.type": "Meeting Type",
      "contact.name": "Contact Name",
      "contact.role": "Role",
      "contact.phone": "Phone",
      "contact.email": "Email",
      "ai.generateSummary": "Generate AI Summary",
      "ai.generateEmail": "Generate Email Draft",
      "ai.editBeforeSave": "Edit before save",
      "language.en": "English",
      "language.he": "עברית (Hebrew)",
      "language.it": "Italiano (Italian)",
      "language.es": "Español (Spanish)",
      "language.fr": "Français (French)",
      "language.de": "Deutsch (German)",
      "language.pt": "Português (Portuguese)",
      "language.ru": "Русский (Russian)",
      "language.zh": "中文 (Chinese)",
      "language.ja": "日本語 (Japanese)",
      "language.ar": "العربية (Arabic)",
      "empty.customers": "No customers yet. Add your first customer.",
      "empty.meetings": "No meetings yet. Add your first meeting.",
      "empty.contacts": "No contacts yet. Add your first contact.",
      "confirm.delete.customer": "Are you sure you want to delete this customer?",
      "confirm.delete.meeting": "Are you sure you want to delete this meeting?",
      "confirm.delete.contact": "Are you sure you want to delete this contact?",
      "error.generic": "An error occurred. Please try again.",
      "success.saved": "Saved successfully",
      "success.deleted": "Deleted successfully",
      "Never": "Never"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default interface language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Utility to detect language of text content
export const detectLanguage = (text: string): string => {
  if (!text) return 'en';
  
  // Hebrew detection
  const hebrewRegex = /[\u0590-\u05FF]/;
  if (hebrewRegex.test(text)) return 'he';
  
  // Arabic detection
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) return 'ar';
  
  // Chinese detection
  const chineseRegex = /[\u4e00-\u9fff]/;
  if (chineseRegex.test(text)) return 'zh';
  
  // Japanese detection
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
  if (japaneseRegex.test(text)) return 'ja';
  
  // Russian detection
  const russianRegex = /[\u0400-\u04FF]/;
  if (russianRegex.test(text)) return 'ru';
  
  // For Latin scripts, try to detect based on common words or patterns
  const lowercaseText = text.toLowerCase();
  
  // Italian detection
  if (lowercaseText.match(/\b(di|del|della|che|con|per|una|questo|essere|molto)\b/)) {
    return 'it';
  }
  
  // Spanish detection
  if (lowercaseText.match(/\b(de|la|el|que|con|para|una|este|ser|muy)\b/)) {
    return 'es';
  }
  
  // French detection
  if (lowercaseText.match(/\b(de|le|la|que|avec|pour|une|ce|être|très)\b/)) {
    return 'fr';
  }
  
  // German detection
  if (lowercaseText.match(/\b(der|die|das|und|mit|für|eine|dieser|sein|sehr)\b/)) {
    return 'de';
  }
  
  // Portuguese detection
  if (lowercaseText.match(/\b(de|da|do|que|com|para|uma|este|ser|muito)\b/)) {
    return 'pt';
  }
  
  // Default to English
  return 'en';
};

// Utility to format text direction based on language
export const getTextDirection = (language: string): 'ltr' | 'rtl' => {
  const rtlLanguages = ['he', 'ar'];
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
};

// Language names for dropdowns
export const languageNames = {
  en: 'English',
  he: 'עברית (Hebrew)',
  it: 'Italiano (Italian)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  pt: 'Português (Portuguese)',
  ru: 'Русский (Russian)',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  ar: 'العربية (Arabic)',
};

export default i18n;
