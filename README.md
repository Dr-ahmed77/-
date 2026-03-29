# MedX Flashcard Bot 🎴

بوت Telegram يولد flashcards من دروس الطب تلقائياً.

## كيفاش يشتغل
- الطالب يبعث PDF أو نص
- البوت يقرأ ويولد flashcards عبر Groq AI
- يرجع البطاقات مباشرة في Telegram

## Deploy على Railway

1. روح على https://railway.app وسجل بـ GitHub
2. New Project → Deploy from GitHub repo
3. ارفع هاد الملفات في repo جديد
4. في Railway، روح على Variables وحط:
   - TELEGRAM_TOKEN = التوكن ديالك
   - GROQ_API_KEY = المفتاح ديالك
5. Deploy!

## استخدام البوت
- ابعث PDF → يولد 10 flashcards
- ابعث نص → يولد 10 flashcards  
- ابعث رقم في أول سطر (مثلاً `15`) لتغيير العدد
- الحد الأقصى: 20 بطاقة
