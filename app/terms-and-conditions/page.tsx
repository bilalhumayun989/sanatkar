'use client';

import { useLanguage } from '@/lib/LanguageContext';
import LegalPage from '@/app/components/legal/LegalPage';

const enContent = {
  title: 'Terms & Conditions',
  description: 'Please read these terms before using Sanatkar. They explain your responsibilities when browsing, buying, selling, and sharing content on our marketplace.',
  sections: [
    { title: 'Using Sanatkar', paragraphs: ['By using Sanatkar, you agree to these terms and our Privacy Policy. If you do not agree, please stop using the service. You must be legally able to enter into a transaction, or use the service with appropriate permission and supervision.'] },
    { title: 'Your account', paragraphs: ['Provide accurate account and contact information and keep it up to date. You are responsible for protecting your login credentials and the activity on your account. Contact support if you suspect unauthorized access.', 'Do not impersonate another person, misuse another account, or attempt to bypass account restrictions or verification.'] },
    { title: 'Listings and seller responsibilities', paragraphs: ['Only list items you own or are authorized to sell. Describe their condition, specifications, availability, price, and location accurately. Use images you have permission to publish and disclose material defects.', 'Illegal, stolen, counterfeit, misleading, or otherwise prohibited items and content are not allowed. Sellers are responsible for any licenses, taxes, warranties, and other obligations that apply to their sales.'] },
    { title: 'Buying and transactions', paragraphs: ['Sanatkar helps buyers and sellers discover listings and communicate. Unless explicitly stated for a particular service, the buyer and seller agree directly on price, inspection, payment, delivery, and returns.', 'Verify the item and seller before making a payment. A verification badge does not guarantee item quality, ownership, or completion of a transaction. Do not share passwords, verification codes, or sensitive payment details in marketplace messages.'] },
    { title: 'Content and the journal', paragraphs: ['You retain ownership of content you submit. You give Sanatkar permission to store, display, and process that content to operate and moderate the marketplace. You must have the rights necessary to submit it.', 'Blog articles provide general information. Confirm specifications and suitability with the relevant manufacturer or professional before making a purchase or carrying out maintenance. Do not copy or republish others\u2019 content without permission.'] },
    { title: 'Acceptable conduct', paragraphs: ['Do not post spam, harassment, discriminatory content, fraudulent offers, or malicious files. Do not collect other users\u2019 information without permission, interfere with the service, or attempt unauthorized access.', 'We may review reported content, remove listings, and restrict accounts that violate these terms. Contact support if you believe an action was taken in error.'] },
    { title: 'Availability and responsibility', paragraphs: ['We aim to keep the marketplace available and accurate, but interruptions and errors can occur. Listings and articles may be changed or removed. We do not guarantee that every listing is accurate or that a buyer or seller will fulfill their obligations.', 'To the extent permitted by applicable law, Sanatkar is not responsible for losses caused by user-provided listings, third-party services, or transactions agreed between users. These terms do not remove rights or responsibilities that cannot be excluded by law.'] },
    { title: 'Changes and contact', paragraphs: ['We may update these terms as the service changes. The date above identifies the latest version. Review the terms periodically and contact support@sanatkar.com for questions, complaints, or reports of misuse.'] },
  ],
};

const urContent = {
  title: 'شرائط و ضوابط',
  description: 'صنعتکار استعمال کرنے سے پہلے براہِ کرم ان شرائط و ضوابط کا بغور مطالعہ کریں۔ ان شرائط میں مارکیٹ پلیس پر مصنوعات دیکھنے، خریدنے، فروخت کرنے اور مواد شیئر کرنے کے دوران آپ کی ذمہ داریوں کی وضاحت کی گئی ہے۔',
  sections: [
    { title: 'صنعتکار کا استعمال', paragraphs: ['صنعتکار استعمال کرنے کا مطلب ہے کہ آپ ان شرائط و ضوابط اور ہماری رازداری کی پالیسی سے اتفاق کرتے ہیں۔ اگر آپ ان شرائط سے اتفاق نہیں کرتے تو براہِ کرم ہماری سروس کا استعمال بند کر دیں۔'] },
    { title: 'آپ کا اکاؤنٹ', paragraphs: ['اپنے اکاؤنٹ اور رابطے کی درست معلومات فراہم کریں اور انہیں وقتاً فوقتاً اپ ڈیٹ رکھیں۔ اپنے لاگ اِن کی تفصیلات محفوظ رکھنا اور اپنے اکاؤنٹ کے ذریعے ہونے والی تمام سرگرمیوں کی ذمہ داری آپ پر عائد ہوتی ہے۔', 'کسی دوسرے شخص کی شناخت اختیار نہ کریں، کسی دوسرے کا اکاؤنٹ استعمال نہ کریں اور اکاؤنٹ کی پابندیوں کو غیر قانونی طریقے سے نظرانداز کرنے کی کوشش نہ کریں۔'] },
    { title: 'اشتہارات اور فروخت کنندگان کی ذمہ داریاں', paragraphs: ['صرف وہی اشیاء فروخت کے لیے پیش کریں جن کے آپ مالک ہوں۔ اشیاء کی حالت، خصوصیات، دستیابی، قیمت اور مقام کے بارے میں درست معلومات فراہم کریں۔', 'غیر قانونی، چوری شدہ، جعلی یا ممنوعہ اشیاء کی تشہیر کی اجازت نہیں ہے۔ فروخت کنندگان تمام قانونی ذمہ داریوں کے خود ذمہ دار ہوں گے۔'] },
    { title: 'خریداری اور لین دین', paragraphs: ['صنعتکار خریداروں اور فروخت کنندگان کو اشتہارات تلاش کرنے اور رابطہ کرنے کی سہولت فراہم کرتا ہے۔ قیمت، معائنہ، ادائیگی اور ترسیل خریدار اور فروخت کنندہ باہمی رضامندی سے طے کریں گے۔', 'ادائیگی کرنے سے پہلے متعلقہ چیز اور فروخت کنندہ کی مکمل تصدیق کر لیں۔ مارکیٹ پلیس کے پیغامات میں حساس معلومات شیئر نہ کریں۔'] },
    { title: 'مواد اور جرنل', paragraphs: ['آپ کی جانب سے جمع کروائے گئے مواد کی ملکیت آپ ہی کے پاس رہے گی۔ تاہم آپ صنعتکار کو اسے مارکیٹ پلیس چلانے کے لیے استعمال کرنے کی اجازت دیتے ہیں۔', 'بلاگ آرٹیکلز عمومی معلومات کے لیے ہیں۔ دوسروں کا مواد ان کی اجازت کے بغیر نقل نہ کریں۔'] },
    { title: 'قابلِ قبول رویہ', paragraphs: ['اسپیم، ہراسانی، امتیازی مواد یا دھوکہ دہی پیش نہ کریں۔ دوسرے صارفین کی معلومات ان کی اجازت کے بغیر جمع نہ کریں۔', 'ہمیں خلافِ ضابطہ اشتہارات ہٹانے اور اکاؤنٹس پر پابندی عائد کرنے کا حق حاصل ہے۔'] },
    { title: 'سروس کی دستیابی اور ذمہ داری', paragraphs: ['ہم مارکیٹ پلیس کو ہر وقت دستیاب رکھنے کی کوشش کرتے ہیں، تاہم تکنیکی خرابیاں پیش آ سکتی ہیں۔', 'قابلِ اطلاق قانون کی حد تک، صنعتکار صارفین کے درمیان طے پانے والے لین دین کے نقصانات کا ذمہ دار نہیں ہوگا۔'] },
    { title: 'شرائط میں تبدیلی اور رابطہ', paragraphs: ['ہم وقتاً فوقتاً ان شرائط کو اپ ڈیٹ کر سکتے ہیں۔ کسی بھی سوال کے لیے support@sanatkar.com پر رابطہ کریں۔'] },
  ],
};

export default function TermsPage() {
  const { language } = useLanguage();
  const content = language === 'ur' ? urContent : enContent;
  return <LegalPage title={content.title} description={content.description} sections={content.sections} />;
}
