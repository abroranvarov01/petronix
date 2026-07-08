"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "uz" | "ru" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "uz",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved && ["uz", "ru", "en"].includes(saved)) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/* ====================================================
   TRANSLATIONS
   ==================================================== */

const t = {
  /* ── Navbar ── */
  nav_products:    { uz: "Mahsulotlar",   ru: "Продукция",         en: "Products" },
  nav_about:       { uz: "Biz haqimizda", ru: "О нас",             en: "About us" },
  nav_contacts:    { uz: "Kontaktlar",     ru: "Контакты",          en: "Contacts" },
  nav_call:        { uz: "Bog'lanish",     ru: "Связаться",         en: "Contact us" },
  nav_login:       { uz: "Kirish",          ru: "Вход",              en: "Sign in" },
  nav_account:     { uz: "Kabinet",         ru: "Кабинет",           en: "Account" },
  nav_logout:      { uz: "Chiqish",         ru: "Выход",             en: "Logout" },

  /* ── Hero ── */
  hero_title:      { uz: "Petronix CNG SOLUTIONS",     ru: "Petronix CNG SOLUTIONS",     en: "Petronix CNG SOLUTIONS" },
  hero_sub:        { uz: "Metan (CNG) zapravka stansiyalari uchun professional yechimlar",
                     ru: "Профессиональные решения для метановых (CNG) заправочных станций",
                     en: "Professional solutions for CNG filling stations" },
  hero_btn:        { uz: "Bog'lanish",     ru: "Связаться",         en: "Contact us" },
  hero_exp:        { uz: "yillik tajriba",   ru: "лет опыта",        en: "years experience" },
  hero_clients:    { uz: "mijozlar",         ru: "клиентов",         en: "clients" },
  hero_support:    { uz: "qo'llab-quvvatlash", ru: "поддержка",     en: "support" },

  /* ── Category banner ── */
  banner_cta:      { uz: "Katalogni ko'rish →", ru: "Смотреть каталог →", en: "View catalog →" },

  /* ── About ── */
  about_title:     { uz: "Kompaniya haqida",  ru: "О компании",      en: "About company" },
  about_p1:        {
    uz: "Petronix — metan (CNG) zapravka stansiyalari uchun sanoat uskunalari va butlovchi qismlar yetkazib beruvchi kompaniya. Biz kompressorlar, filtratsiya tizimlari, ehtiyot qismlar va CNG obyektlarini qurish, modernizatsiya qilish hamda xizmat ko'rsatish uchun texnik yechimlar yetkazib berishga ixtisoslashganmiz.",
    ru: "Petronix — компания-поставщик промышленного оборудования и комплектующих для метановых (CNG) заправочных станций. Мы специализируемся на поставках компрессоров, систем фильтрации, запасных частей и технических решений для строительства, модернизации и обслуживания CNG объектов.",
    en: "Petronix is a supplier of industrial equipment and components for CNG filling stations. We specialize in compressors, filtration systems, spare parts and technical solutions for construction, modernization and maintenance of CNG facilities." },
  about_p2:        {
    uz: "Kompaniyamiz sanoat korxonalari va zapravka stansiyalari egalari bilan ishlaydi, uskunalarning barqaror yetkazib berilishi va tezkor texnik yordamni ta'minlaydi. Biz CNG stansiyalarining ishlash xususiyatlarini yaxshi tushunamiz va uskunalarning samaradorligini oshirish hamda to'xtab qolish vaqtini kamaytirishga qaratilgan yechimlarni taklif qilamiz.",
    ru: "Наша компания работает с промышленными предприятиями и владельцами заправочных станций, обеспечивая стабильные поставки оборудования и оперативную техническую поддержку. Мы хорошо понимаем особенности работы CNG станций и предлагаем решения, направленные на повышение эффективности оборудования и сокращение простоев.",
    en: "Our company works with industrial enterprises and filling station owners, ensuring stable equipment supply and prompt technical support. We understand CNG station operations well and offer solutions aimed at improving equipment efficiency and reducing downtime." },
  about_p3:        {
    uz: "Jamoamiz loyihalarni barcha bosqichlarda — uskunani tanlash va hisob-kitob qilishdan tortib, yetkazib berish, ishga tushirish va servis xizmatigacha kuzatib boradi. Biz uzoq muddatli hamkorlik va ishonchlilikni qadrlaymiz.",
    ru: "Наша команда сопровождает проекты на всех этапах — от подбора и расчёта оборудования до поставки, пуско-наладки и сервисного обслуживания. Мы ценим долгосрочное партнёрство и надёжность.",
    en: "Our team supports projects at all stages — from equipment selection and calculation to delivery, commissioning and service. We value long-term partnership and reliability." },
  about_offer:     { uz: "Tijorat taklifini olish", ru: "Получить коммерческое предложение", en: "Get a quote" },
  about_support:   { uz: "texnik qo'llab-quvvatlash", ru: "техническая поддержка", en: "technical support" },
  about_projects:  { uz: "amalga oshirilgan loyihalar", ru: "реализованных проектов", en: "completed projects" },
  about_experience:{ uz: "yillik tajriba",   ru: "лет опыта",        en: "years experience" },

  /* ── Solutions ── */
  solutions_title: { uz: "CNG stansiyalari uchun kompleks yechimlar",
                     ru: "Комплексные решения для CNG станций",
                     en: "Comprehensive solutions for CNG stations" },
  sol1_title:      { uz: "Kompressorlar yetkazib berish",     ru: "Поставка компрессоров",         en: "Compressor supply" },
  sol1_desc:       { uz: "Zapravka stansiyalari uchun sanoat CNG kompressorlari.",
                     ru: "Промышленные CNG компрессоры для заправочных станций.",
                     en: "Industrial CNG compressors for filling stations." },
  sol2_title:      { uz: "Ehtiyot qismlar va butlovchi elementlar",
                     ru: "Запчасти и комплектующие",
                     en: "Spare parts and components" },
  sol2_desc:       { uz: "Klapanlar, filtrlar, sovutish modullari va nazorat tizimlari.",
                     ru: "Клапаны, фильтры, модули охлаждения и системы контроля.",
                     en: "Valves, filters, cooling modules and control systems." },
  sol3_title:      { uz: "Servis va texnik xizmat",            ru: "Сервис и техобслуживание",      en: "Service and maintenance" },
  sol3_desc:       { uz: "Diagnostika, ta'mirlash va 24/7 texnik qo'llab-quvvatlash.",
                     ru: "Диагностика, ремонт и круглосуточная техническая поддержка.",
                     en: "Diagnostics, repair and 24/7 technical support." },

  /* ── Process ── */
  process_title:   { uz: "Biz qanday ishlaymiz",   ru: "Как мы работаем",    en: "How we work" },
  step1_title:     { uz: "Vazifani tahlil qilish",  ru: "Анализ задачи",      en: "Task analysis" },
  step1_desc:      { uz: "Stansiyaning texnik talablari va parametrlarini o'rganamiz.",
                     ru: "Изучаем технические требования и параметры станции.",
                     en: "We study the station's technical requirements and parameters." },
  step2_title:     { uz: "Uskunani tanlash",          ru: "Подбор оборудования", en: "Equipment selection" },
  step2_desc:      { uz: "Uskunaning optimal konfiguratsiyasini taklif qilamiz.",
                     ru: "Предлагаем оптимальную конфигурацию оборудования.",
                     en: "We offer the optimal equipment configuration." },
  step3_title:     { uz: "Yetkazib berish va ishga tushirish",
                     ru: "Поставка и пуско-наладка",
                     en: "Delivery and commissioning" },
  step3_desc:      { uz: "Yetkazib berish va ishga tushirish jarayonini tashkil qilamiz.",
                     ru: "Организуем процесс доставки и пуско-наладки.",
                     en: "We organize the delivery and commissioning process." },
  step4_title:     { uz: "Servis qo'llab-quvvatlash", ru: "Сервисная поддержка", en: "Service support" },
  step4_desc:      { uz: "24/7 texnik xizmat ko'rsatamiz.",
                     ru: "Оказываем техническое обслуживание 24/7.",
                     en: "We provide 24/7 technical service." },

  /* ── Projects ── */
  projects_title:  { uz: "Amalga oshirilgan loyihalar", ru: "Реализованные проекты", en: "Completed projects" },
  projects_sub:    { uz: "CNG obyektlari uchun amalga oshirilgan yetkazib berish va texnik yechimlar namunasi.",
                     ru: "Примеры поставок и технических решений для CNG объектов.",
                     en: "Examples of supplies and technical solutions for CNG facilities." },
  proj1_title:     { uz: "CNG stansiyasini modernizatsiya qilish", ru: "Модернизация CNG станции",     en: "CNG station modernization" },
  proj1_desc:      { uz: "Kompressor uskunalari va filtrlash tizimlarini yetkazib berish.",
                     ru: "Поставка компрессорного оборудования и систем фильтрации.",
                     en: "Supply of compressor equipment and filtration systems." },
  proj2_title:     { uz: "Yangi stansiya qurilishi",              ru: "Строительство новой станции",    en: "New station construction" },
  proj2_desc:      { uz: "Ishga tushirish uchun kompleks uskunalar va texnik yordam.",
                     ru: "Комплексное оборудование и техническая поддержка для пуска.",
                     en: "Comprehensive equipment and technical support for launch." },
  proj3_title:     { uz: "Servis xizmati",                       ru: "Сервисное обслуживание",         en: "Service maintenance" },
  proj3_desc:      { uz: "Diagnostika va operatsion ob'ekt uchun komponentlarni etkazib berish.",
                     ru: "Диагностика и поставка компонентов для действующего объекта.",
                     en: "Diagnostics and component supply for operating facility." },

  /* ── CTA ── */
  cta_title:       { uz: "Loyihangizni muhokama qilishga tayyormisiz?",
                     ru: "Готовы обсудить ваш проект?",
                     en: "Ready to discuss your project?" },
  cta_sub:         { uz: "24 soat ichida individual tijorat taklifi va texnik hisob-kitob tayyorlaymiz.",
                     ru: "Подготовим индивидуальное коммерческое предложение и технический расчёт в течение 24 часов.",
                     en: "We'll prepare an individual quote and technical estimate within 24 hours." },
  cta_name:        { uz: "Ismingiz",            ru: "Ваше имя",          en: "Your name" },
  cta_phone:       { uz: "Telefon raqamingiz",  ru: "Ваш телефон",       en: "Your phone" },
  cta_email:       { uz: "Email manzilingiz",   ru: "Ваш Email",         en: "Your email" },
  cta_submit:      { uz: "Ariza yuborish",      ru: "Отправить заявку",   en: "Submit request" },
  cta_sending:     { uz: "Yuborilmoqda...",     ru: "Отправка...",        en: "Sending..." },
  cta_success:     { uz: "Ariza muvaffaqiyatli yuborildi!", ru: "Заявка успешно отправлена!", en: "Request sent successfully!" },
  cta_error:       { uz: "Server xatosi.",      ru: "Ошибка сервера.",    en: "Server error." },
  cta_network:     { uz: "Tarmoq xatosi.",      ru: "Ошибка сети.",       en: "Network error." },
  cta_trust1:      { uz: "24 soat ichida javob",      ru: "Ответ в течение 24 часов",    en: "Response within 24 hours" },
  cta_trust2:      { uz: "Maxfiylik kafolatlanadi",    ru: "Конфиденциальность гарантирована", en: "Confidentiality guaranteed" },
  cta_trust3:      { uz: "Bepul maslahat",             ru: "Бесплатная консультация",     en: "Free consultation" },

  /* ── FAQ ── */
  faq_title:       { uz: "Ko'p beriladigan savollar",  ru: "Часто задаваемые вопросы",  en: "Frequently asked questions" },
  faq1_q:          { uz: "Tijorat taklifi qancha vaqtda tayyorlanadi?",
                     ru: "Сколько времени занимает подготовка коммерческого предложения?",
                     en: "How long does it take to prepare a quote?" },
  faq1_a:          { uz: "Loyihaning murakkabligiga qarab o'rtacha 24-48 soat.",
                     ru: "В среднем 24-48 часов в зависимости от сложности проекта.",
                     en: "On average 24-48 hours depending on project complexity." },
  faq2_q:          { uz: "Viloyatlar bilan ishlaysizmi?",
                     ru: "Работаете ли вы с регионами?",
                     en: "Do you work with regions?" },
  faq2_a:          { uz: "Ha, biz butun O'zbekiston bo'ylab uskunalar yetkazib beramiz.",
                     ru: "Да, мы доставляем оборудование по всему Узбекистану.",
                     en: "Yes, we deliver equipment throughout Uzbekistan." },
  faq3_q:          { uz: "Kafolat beriladimi?",        ru: "Предоставляется ли гарантия?", en: "Is there a warranty?" },
  faq3_a:          { uz: "Biz ishlab chiqaruvchining rasmiy kafolati asosida sertifikatlangan uskunalarni yetkazib berishni ta'minlaymiz.",
                     ru: "Мы обеспечиваем поставку сертифицированного оборудования с официальной гарантией производителя.",
                     en: "We ensure the supply of certified equipment with the manufacturer's official warranty." },
  faq4_q:          { uz: "Servis qo'llab-quvvatlash ko'rsatasizmi?",
                     ru: "Оказываете ли вы сервисную поддержку?",
                     en: "Do you provide service support?" },
  faq4_a:          { uz: "Ha, biz 24/7 texnik qo'llab-quvvatlash va servis xizmatlarini ko'rsatamiz.",
                     ru: "Да, мы предоставляем круглосуточную техническую поддержку и сервисное обслуживание.",
                     en: "Yes, we provide 24/7 technical support and service maintenance." },

  /* ── Contacts ── */
  contacts_title:  { uz: "Kontaktlar",             ru: "Контакты",            en: "Contacts" },
  contacts_reach:  { uz: "Biz bilan bog'laning",   ru: "Свяжитесь с нами",    en: "Get in touch" },
  contacts_phone:  { uz: "Telefon",                ru: "Телефон",             en: "Phone" },
  contacts_address:{ uz: "Manzil",                 ru: "Адрес",               en: "Address" },
  contacts_addr_val:{ uz: "Toshkent shahri, Sergeli tumani, Sultonobod mahallasi, 272A",
                      ru: "г. Ташкент, Сергелийский район, махалля Султонобод, 272A",
                      en: "Tashkent city, Sergeli district, Sultonobod mahalla, 272A" },
  contacts_tg:     { uz: "Telegram orqali yozish",  ru: "Написать в Telegram",  en: "Write via Telegram" },

  /* ── Footer ── */
  footer_desc:     { uz: "CNG stansiyalari uchun uskunalar va butlovchi qismlar yetkazib beruvchi kompaniya. Gaz to'ldirish infratuzilmasini qurish va modernizatsiya qilish bo'yicha kompleks yechimlarni taklif etamiz.",
                     ru: "Компания-поставщик оборудования и комплектующих для CNG станций. Предлагаем комплексные решения по строительству и модернизации газозаправочной инфраструктуры.",
                     en: "Equipment and components supplier for CNG stations. We offer comprehensive solutions for construction and modernization of gas filling infrastructure." },
  footer_nav:      { uz: "Navigatsiya",    ru: "Навигация",     en: "Navigation" },
  footer_about:    { uz: "Kompaniya haqida", ru: "О компании",  en: "About company" },
  footer_solutions:{ uz: "Yechimlar",       ru: "Решения",      en: "Solutions" },
  footer_projects: { uz: "Loyihalar",       ru: "Проекты",      en: "Projects" },
  footer_copy:     { uz: "Barcha huquqlar himoyalangan.",
                     ru: "Все права защищены.",
                     en: "All rights reserved." },

  /* ── Products page ── */
  prod_all:        { uz: "Barchasi",          ru: "Все",               en: "All" },
  prod_categories: { uz: "Kategoriyalar",     ru: "Категории",         en: "Categories" },
  prod_subcategories:{ uz: "Subkategoriyalar", ru: "Подкатегории",     en: "Subcategories" },
  prod_all_products:{ uz: "Barcha mahsulotlar", ru: "Все товары",      en: "All products" },
  prod_search:     { uz: "Mahsulot qidirish...", ru: "Поиск товара...", en: "Search product..." },
  prod_search_btn: { uz: "Qidirish",            ru: "Поиск",              en: "Search" },
  prod_loading:    { uz: "Yuklanmoqda...",    ru: "Загрузка...",        en: "Loading..." },
  prod_empty:      { uz: "Mahsulotlar topilmadi.", ru: "Товары не найдены.", en: "No products found." },
  prod_order:      { uz: "Buyurtma berish",   ru: "Заказать",           en: "Order" },
  prod_details:    { uz: "Batafsil",          ru: "Подробнее",          en: "Details" },
  prod_load_more:  { uz: "Yana ko'rsatish",   ru: "Показать ещё",       en: "Load more" },
  prod_add_cart:   { uz: "Savatga qo'shish",  ru: "В корзину",          en: "Add to cart" },
  prod_in_cart:    { uz: "Savatda",           ru: "В корзине",          en: "In cart" },

  /* ── Product detail page ── */
  badge_original:  { uz: "Original",          ru: "Оригинал",           en: "Original" },
  pd_back:         { uz: "Katalogga qaytish", ru: "Назад в каталог",    en: "Back to catalog" },
  pd_not_found:    { uz: "Mahsulot topilmadi", ru: "Товар не найден",   en: "Product not found" },
  pd_description:  { uz: "Tavsif",            ru: "Описание",           en: "Description" },
  pd_no_desc:      { uz: "Tavsif yo'q",       ru: "Описание отсутствует", en: "No description" },
  pd_qty:          { uz: "Miqdor",            ru: "Количество",         en: "Quantity" },
  pd_buy_now:      { uz: "Hoziroq sotib olish", ru: "Купить сейчас",    en: "Buy now" },
  pd_added:        { uz: "Savatga qo'shildi", ru: "Добавлено в корзину", en: "Added to cart" },
  pd_seller:       { uz: "Sotuvchi",          ru: "Продавец",           en: "Seller" },
  pd_categories:   { uz: "Kategoriyalar",     ru: "Категории",          en: "Categories" },
  pd_share:        { uz: "Ulashish",          ru: "Поделиться",         en: "Share" },
  pd_link_copied:  { uz: "Havola nusxalandi", ru: "Ссылка скопирована", en: "Link copied" },
  pd_delivery:     { uz: "Butun O'zbekiston bo'ylab yetkazib berish", ru: "Доставка по всему Узбекистану", en: "Delivery across Uzbekistan" },
  pd_guarantee:    { uz: "Sifat kafolati",    ru: "Гарантия качества",  en: "Quality guarantee" },
  pd_return:       { uz: "Qaytarish 14 kun ichida", ru: "Возврат в течение 14 дней", en: "14-day return" },

  /* ── Cart / Checkout ── */
  cart_title:      { uz: "Savatcha",          ru: "Корзина",            en: "Cart" },
  cart_empty:      { uz: "Savatcha bo'sh",    ru: "Корзина пуста",      en: "Your cart is empty" },
  cart_total:      { uz: "Jami",              ru: "Итого",              en: "Total" },
  cart_checkout:   { uz: "Buyurtma rasmiylashtirish", ru: "Оформить заказ", en: "Checkout" },
  cart_remove:     { uz: "O'chirish",         ru: "Удалить",            en: "Remove" },
  cart_continue:   { uz: "Xaridni davom ettirish", ru: "Продолжить покупки", en: "Continue shopping" },
  co_name:         { uz: "Ismingiz",          ru: "Ваше имя",           en: "Your name" },
  co_phone:        { uz: "Telefon",           ru: "Телефон",            en: "Phone" },
  co_address:      { uz: "Manzil",            ru: "Адрес",              en: "Address" },
  co_comment:      { uz: "Izoh",              ru: "Комментарий",        en: "Comment" },
  co_submit:       { uz: "Buyurtma berish",   ru: "Оформить заказ",     en: "Place order" },
  co_success:      { uz: "Buyurtma qabul qilindi!", ru: "Заказ принят!", en: "Order placed!" },
  co_success_sub:  { uz: "Tez orada siz bilan bog'lanamiz", ru: "Мы свяжемся с вами в ближайшее время", en: "We will contact you shortly" },
  nav_cart:        { uz: "Savatcha",          ru: "Корзина",            en: "Cart" },

  /* ── Login / Register ── */
  login_title:     { uz: "Tizimga kirish",    ru: "Вход в систему",     en: "Sign in" },
  login_email:     { uz: "Email",             ru: "Email",              en: "Email" },
  login_pass:      { uz: "Parol",             ru: "Пароль",             en: "Password" },
  login_pass_ph:   { uz: "Parolni kiriting",  ru: "Введите пароль",     en: "Enter password" },
  login_btn:       { uz: "Kirish",            ru: "Войти",              en: "Sign in" },
  login_loading:   { uz: "Kirilmoqda...",     ru: "Вход...",            en: "Signing in..." },
  login_no_acc:    { uz: "Hisobingiz yo'qmi?", ru: "Нет аккаунта?",    en: "No account?" },
  login_register:  { uz: "Ro'yxatdan o'tish", ru: "Регистрация",       en: "Register" },
  login_error:     { uz: "Kirish xatosi",     ru: "Ошибка входа",      en: "Login error" },
  login_net_err:   { uz: "Server bilan bog'lanishda xatolik", ru: "Ошибка соединения с сервером", en: "Server connection error" },

  reg_title:       { uz: "Diller sifatida ro'yxatdan o'tish", ru: "Регистрация дилера", en: "Dealer registration" },
  reg_name:        { uz: "Ism",               ru: "Имя",                en: "Name" },
  reg_name_ph:     { uz: "Ismingiz",          ru: "Ваше имя",           en: "Your name" },
  reg_pass_ph:     { uz: "Kamida 6 ta belgi", ru: "Минимум 6 символов", en: "At least 6 characters" },
  reg_btn:         { uz: "Ro'yxatdan o'tish", ru: "Зарегистрироваться", en: "Register" },
  reg_loading:     { uz: "Yuborilmoqda...",   ru: "Отправка...",        en: "Submitting..." },
  reg_has_acc:     { uz: "Allaqachon hisobingiz bormi?", ru: "Уже есть аккаунт?", en: "Already have an account?" },
  reg_login:       { uz: "Kirish",            ru: "Войти",              en: "Sign in" },
  reg_error:       { uz: "Ro'yxatdan o'tishda xatolik", ru: "Ошибка регистрации", en: "Registration error" },
  reg_pending:     { uz: "So'rovingiz qabul qilindi. Administrator tasdiqlagach tizimga kira olasiz.", ru: "Заявка принята. Вы сможете войти после подтверждения администратором.", en: "Your request was received. You can sign in once an admin approves it." },
} as const;

type TKey = keyof typeof t;

export function useT() {
  const { lang } = useLang();
  return (key: TKey) => t[key][lang];
}
