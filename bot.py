import os
import json
import logging
import tempfile
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from groq import Groq
import PyPDF2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "8755380606:AAEQca6g8Xhhoo1SsYg01YOTcARINpsFGhs")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

client = Groq(api_key=GROQ_API_KEY)

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text.strip()

def generate_flashcards(lesson_text: str, count: int = 10) -> list:
    prompt = f"""من هذا الدرس الطبي، ولّد بالضبط {count} flashcard.

الدرس:
{lesson_text[:4000]}

أجب فقط بـ JSON صحيح بهذا الشكل بدون أي مقدمة أو backticks:
{{"cards":[{{"q":"السؤال هنا","a":"الجواب المختصر والدقيق هنا"}}]}}

القواعد:
- الأسئلة دقيقة ومحددة
- الأجوبة مختصرة وتعليمية
- ركز على التعاريف، الآليات، الأرقام المهمة، والتشخيص
- استعمل لغة الدرس (عربي أو فرنسي)
- عدد البطاقات: {count} بالضبط"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
        temperature=0.3,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(raw)
    return parsed["cards"]

def format_flashcards(cards: list) -> str:
    lines = ["🎴 *Flashcards جاهزة!*\n"]
    for i, card in enumerate(cards, 1):
        lines.append(f"*{i}\\. ❓ {escape_md(card['q'])}*")
        lines.append(f"✅ {escape_md(card['a'])}")
        lines.append("─────────────────")
    lines.append(f"\n📚 _توليد {len(cards)} بطاقة بنجاح_")
    return "\n".join(lines)

def escape_md(text: str) -> str:
    chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for c in chars:
        text = text.replace(c, f'\\{c}')
    return text

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (
        "👋 أهلاً في *MedX Flashcards Bot*\\!\n\n"
        "📤 *كيفاش تستعملني:*\n"
        "• ابعثلي PDF ديال الدرس\n"
        "• أو ابعثلي النص مباشرة\n\n"
        "وأنا نولدلك flashcards في ثواني 🚀\n\n"
        "💡 _يمكنك تحديد عدد البطاقات بكتابة رقم قبل النص، مثلاً: `15 نص الدرس...`_"
    )
    await update.message.reply_text(msg, parse_mode="MarkdownV2")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (
        "📖 *كيفاش تستعمل البوت:*\n\n"
        "1\\. ابعث PDF ديال الدرس\n"
        "2\\. أو الصق النص مباشرة\n"
        "3\\. البوت يولدلك 10 flashcards تلقائياً\n\n"
        "⚙️ *لتغيير عدد البطاقات:*\n"
        "ابعث رقم في caption ديال الـ PDF\n"
        "مثلاً: `15` في الـ caption\n\n"
        "📌 *الحد الأقصى:* 20 بطاقة"
    )
    await update.message.reply_text(msg, parse_mode="MarkdownV2")

async def handle_pdf(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ جاري قراءة الـ PDF...")

    count = 10
    if update.message.caption:
        try:
            count = min(int(update.message.caption.strip()), 20)
        except ValueError:
            pass

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        file = await update.message.document.get_file()
        await file.download_to_drive(tmp.name)
        tmp_path = tmp.name

    try:
        text = extract_text_from_pdf(tmp_path)
        if not text or len(text) < 50:
            await update.message.reply_text("❌ ما قدرتش نقرأ الـ PDF. جرب ترسل النص مباشرة.")
            return

        await update.message.reply_text(f"✅ قرأت الـ PDF\\! جاري توليد {count} flashcards\\.\\.\\.", parse_mode="MarkdownV2")
        cards = generate_flashcards(text, count)
        result = format_flashcards(cards)

        # إذا كان الرد طويل نقسمه
        if len(result) > 4000:
            mid = len(cards) // 2
            await update.message.reply_text(format_flashcards(cards[:mid]), parse_mode="MarkdownV2")
            await update.message.reply_text(format_flashcards(cards[mid:]), parse_mode="MarkdownV2")
        else:
            await update.message.reply_text(result, parse_mode="MarkdownV2")

    except Exception as e:
        logger.error(f"Error: {e}")
        await update.message.reply_text("❌ وقع خطأ. جرب مرة أخرى أو ابعث النص مباشرة.")
    finally:
        os.unlink(tmp_path)

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()

    if len(text) < 30:
        await update.message.reply_text("📝 الدرس قصير بزاف. ابعثلي نص أطول أو PDF.")
        return

    count = 10
    lines = text.split("\n")
    try:
        first = lines[0].strip()
        if first.isdigit():
            count = min(int(first), 20)
            text = "\n".join(lines[1:]).strip()
    except:
        pass

    await update.message.reply_text(f"⏳ جاري توليد {count} flashcards\\.\\.\\.", parse_mode="MarkdownV2")

    try:
        cards = generate_flashcards(text, count)
        result = format_flashcards(cards)

        if len(result) > 4000:
            mid = len(cards) // 2
            await update.message.reply_text(format_flashcards(cards[:mid]), parse_mode="MarkdownV2")
            await update.message.reply_text(format_flashcards(cards[mid:]), parse_mode="MarkdownV2")
        else:
            await update.message.reply_text(result, parse_mode="MarkdownV2")

    except Exception as e:
        logger.error(f"Error: {e}")
        await update.message.reply_text("❌ وقع خطأ. جرب مرة أخرى.")

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.Document.PDF, handle_pdf))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    logger.info("البوت شغال...")
    app.run_polling()

if __name__ == "__main__":
    main()
