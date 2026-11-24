'use client';

import { useLanguage } from '@/lib/LanguageContext';
import LegalPage from '@/app/components/legal/LegalPage';

const enContent = {
  title: 'Privacy Policy',
  description: 'Your privacy matters. This policy explains the information used to run Sanatkar and how you can manage the information you share.',
  sections: [
    { title: 'Information you provide', paragraphs: ['We process information you submit when creating an account, editing your profile, posting a listing, sending messages, or contacting support. This may include your name, username, email address, phone number, city, listing images, and transaction-related communications.', 'Seller applications and verification may include business details, shop images, identity information such as a CNIC, and supporting documents. Submit only the information requested for the relevant process.'] },
    { title: 'Technical information and cookies', paragraphs: ['The service uses authentication cookies and browser storage to maintain your session and remember preferences such as language. Our hosting and service providers may process technical information such as IP addresses, request details, and error logs to deliver and protect the service.', 'You can manage cookies and browser storage in your browser settings. Blocking or deleting authentication storage may sign you out or prevent account features from working.'] },
    { title: 'How information is used', paragraphs: ['We use information to authenticate users, manage profiles and listings, enable buyer and seller communication, review seller applications, respond to support requests, and detect misuse.', 'We also use necessary technical information to troubleshoot errors, maintain reliability, and improve the marketplace.'] },
    { title: 'Public information and sharing', paragraphs: ['Published listings, shop profiles, and information displayed on them can be viewed by other visitors. Information you send in a conversation is available to its participants. Avoid placing identity documents or other sensitive information in public listings or messages.', 'Service providers that support authentication, database storage, file storage, and hosting process information needed to provide those services. We may also disclose information when required by applicable law or to investigate abuse and protect users.'] },
    { title: 'Storage and security', paragraphs: ['We use access controls and authentication to protect account information and restrict administrative features. No storage or transmission method can guarantee complete security; keep your credentials private and report suspected account misuse.', 'Information may be processed where our service providers operate, including outside your country. We keep information as needed to provide the service, handle requests and disputes, protect against misuse, and meet applicable obligations.'] },
    { title: 'Your choices and requests', paragraphs: ['You can update supported profile fields in your account settings and manage your listings through your account. Contact support@sanatkar.com to request access, correction, or deletion of account information.', 'We may need to verify your identity before acting on a request. Some information may need to be retained to resolve disputes, prevent fraud, or meet legal obligations. Available privacy rights depend on applicable law.'] },
    { title: 'External links', paragraphs: ['Listings, articles, and other pages may link to external websites or load images from external providers. Those providers may receive technical information when your browser requests their content. Their own privacy policies govern how they handle information.'] },
    { title: 'Updates and contact', paragraphs: ['We may update this policy as the marketplace changes. The date above identifies the latest version. For privacy questions or requests, email support@sanatkar.com.'] },
  ],
};

const urContent = {
  title: 'رازداری کی پالیسی',
  description: 'آپ کی رازداری ہمارے لیے اہم ہے۔ اس پالیسی میں وضاحت کی گئی ہے کہ صنعتکار کو چلانے کے لیے کون سی معلومات استعمال کی جاتی ہیں اور آپ اپنی فراہم کردہ معلومات کو کس طرح منظم کر سکتے ہیں۔',
  sections: [
    { title: 'آپ کی فراہم کردہ معلومات', paragraphs: ['جب آپ اکاؤنٹ بناتے ہیں، پروفائل میں تبدیلی کرتے ہیں، اشتہار شائع کرتے ہیں، پیغامات بھیجتے ہیں یا سپورٹ سے رابطہ کرتے ہیں تو ہم آپ کی فراہم کردہ معلومات پراسیس کرتے ہیں۔ ان میں نام، صارف نام، ای میل، فون نمبر، شہر، اشتہارات کی تصاویر اور لین دین سے متعلق گفتگو شامل ہو سکتی ہے۔', 'فروخت کنندہ کی درخواست اور تصدیق کے دوران کاروباری تفصیلات، دکان کی تصاویر، شناختی معلومات جیسے CNIC اور معاون دستاویزات طلب کی جا سکتی ہیں۔'] },
    { title: 'تکنیکی معلومات اور کوکیز', paragraphs: ['سروس آپ کے سیشن کو برقرار رکھنے اور زبان جیسی ترجیحات یاد رکھنے کے لیے تصدیقی کوکیز استعمال کرتی ہے۔ ہوسٹنگ فراہم کرنے والے ادارے IP ایڈریس اور تکنیکی خرابیوں کی معلومات بھی پراسیس کر سکتے ہیں۔', 'آپ براؤزر سیٹنگز میں کوکیز کو منظم کر سکتے ہیں۔ تصدیقی معلومات بلاک کرنے سے اکاؤنٹ لاگ آؤٹ ہو سکتا ہے۔'] },
    { title: 'معلومات کا استعمال', paragraphs: ['ہم معلومات کا استعمال صارفین کی تصدیق، پروفائلز اور اشتہارات کے انتظام، رابطے کی سہولت، فروخت کنندگان کی درخواستوں کے جائزے اور غلط استعمال کی نشاندہی کے لیے کرتے ہیں۔', 'تکنیکی معلومات خرابیوں کو دور کرنے اور سروس کو بہتر بنانے کے لیے بھی استعمال کی جاتی ہیں۔'] },
    { title: 'عوامی معلومات اور اشتراک', paragraphs: ['شائع کیے گئے اشتہارات اور دکانوں کی پروفائلز دوسرے وزٹرز کے لیے قابلِ رسائی ہو سکتی ہیں۔ گفتگو میں بھیجی گئی معلومات اس کے شرکاء کو دستیاب ہوتی ہیں۔ شناختی دستاویزات عوامی اشتہارات یا پیغامات میں شامل نہ کریں۔', 'سروس فراہم کرنے والے ادارے اپنی خدمات کے لیے ضروری معلومات پراسیس کرتے ہیں۔ قانونی تقاضوں یا غلط استعمال کی تحقیقات کے لیے معلومات متعلقہ حکام سے بھی شیئر کی جا سکتی ہیں۔'] },
    { title: 'معلومات کا ذخیرہ اور تحفظ', paragraphs: ['ہم اکاؤنٹ کی معلومات کے تحفظ کے لیے رسائی کے کنٹرول اور تصدیقی نظام استعمال کرتے ہیں۔ اپنے لاگ اِن کی تفصیلات خفیہ رکھیں اور مشکوک سرگرمی کی فوری اطلاع دیں۔', 'معلومات ہمارے سروس فراہم کرنے والوں کے مقامات پر پراسیس کی جا سکتی ہیں۔ ہم معلومات اتنی مدت تک محفوظ رکھتے ہیں جتنی سروس اور قانونی ذمہ داریوں کے لیے ضروری ہو۔'] },
    { title: 'آپ کے اختیارات اور درخواستیں', paragraphs: ['آپ اکاؤنٹ سیٹنگز میں پروفائل کی معلومات اپ ڈیٹ کر سکتے ہیں۔ معلومات تک رسائی، درستگی یا حذف کروانے کے لیے support@sanatkar.com پر رابطہ کریں۔', 'درخواست پر کارروائی سے پہلے شناخت کی تصدیق ضروری ہو سکتی ہے۔ بعض معلومات قانونی ذمہ داریوں کے لیے محفوظ رکھنا ضروری ہو سکتا ہے۔'] },
    { title: 'بیرونی لنکس', paragraphs: ['اشتہارات اور صفحات میں بیرونی ویب سائٹس کے لنکس یا بیرونی تصاویر شامل ہو سکتی ہیں۔ ان اداروں کی رازداری پالیسی ان کی معلومات کے استعمال کا تعین کرتی ہے۔'] },
    { title: 'پالیسی میں تبدیلیاں اور رابطہ', paragraphs: ['ہم وقتاً فوقتاً اس پالیسی کو اپ ڈیٹ کر سکتے ہیں۔ کسی بھی سوال کے لیے support@sanatkar.com پر رابطہ کریں۔'] },
  ],
};

export default function PrivacyPage() {
  const { language } = useLanguage();
  const content = language === 'ur' ? urContent : enContent;
  return <LegalPage privacy title={content.title} description={content.description} sections={content.sections} />;
}
