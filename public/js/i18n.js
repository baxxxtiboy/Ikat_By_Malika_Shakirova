'use strict';
/* ===== Tillar: o'zbekcha (asosiy), inglizcha, ruscha =====
 * Kalit — o'zbekcha matnning o'zi: _t('Savat'), _t('Faqat {0} qolgan', 3).
 * Tarjimasi bo'lmagan matn o'zbekcha ko'rinadi. Yangi matn: quyidagi ro'yxatga [uz, en, ru] qatorini qo'shing.
 */
const I18N = [
  /* ---- umumiy ---- */
  ["so'm", 'UZS', 'сум'], ['dona', 'pcs', 'шт.'], ['m', 'm', 'м'],
  ['Yanvar', 'January', 'Январь'], ['Fevral', 'February', 'Февраль'], ['Mart', 'March', 'Март'], ['Aprel', 'April', 'Апрель'],
  ['May', 'May', 'Май'], ['Iyun', 'June', 'Июнь'], ['Iyul', 'July', 'Июль'], ['Avgust', 'August', 'Август'],
  ['Sentabr', 'September', 'Сентябрь'], ['Oktabr', 'October', 'Октябрь'], ['Noyabr', 'November', 'Ноябрь'], ['Dekabr', 'December', 'Декабрь'],
  ["Internet aloqasi yo'q yoki server javob bermayapti", 'No internet connection or the server is not responding', 'Нет интернета или сервер не отвечает'],
  ['Xatolik yuz berdi', 'Something went wrong', 'Произошла ошибка'],
  ["Server bilan aloqa yo'q", 'Cannot reach the server', 'Нет связи с сервером'],
  ['Yuklanmadi', 'Failed to load', 'Не удалось загрузить'], ['Qayta urinish', 'Try again', 'Повторить'],
  ['Yopish', 'Close', 'Закрыть'], ["Kiritilgan ma'lumotlar saqlanmaydi.", 'The data you entered will not be saved.', 'Введённые данные не сохранятся.'],
  ['Ha', 'Yes', 'Да'], ['Bekor', 'Cancel', 'Отмена'], ['Yaxshi', 'OK', 'Хорошо'],
  ['Saqlash', 'Save', 'Сохранить'], ['Saqlandi', 'Saved', 'Сохранено'], ["O'chirish", 'Delete', 'Удалить'], ["O'chirildi", 'Deleted', 'Удалено'],
  ['Tahrirlash', 'Edit', 'Изменить'], ['Yangilash', 'Refresh', 'Обновить'], ['Yangilandi', 'Updated', 'Обновлено'], ['Tozalash', 'Clear', 'Очистить'],
  ['Hammasi', 'All', 'Все'], ['Yangi', 'New', 'Новинки'], ['Boshqa', 'Other', 'Другой'], ['Qidiruv', 'Search', 'Поиск'], ['Topilmadi', 'Not found', 'Не найдено'],
  ['Faqat rasm fayli tanlang', 'Please choose an image file', 'Выберите файл изображения'],
  ['Bu rasm formati ochilmadi. JPG yoki PNG tanlang', 'This image format could not be opened. Choose JPG or PNG', 'Этот формат не открывается. Выберите JPG или PNG'],
  ['Bosh sahifa', 'Home', 'Главная'], ['Asosiy menyu', 'Main menu', 'Главное меню'], ['Til', 'Language', 'Язык'],
  ['Katalog', 'Catalog', 'Каталог'], ['Savat', 'Cart', 'Корзина'], ['Nasiya', 'Installments', 'Рассрочка'], ['Profil', 'Profile', 'Профиль'],

  /* ---- holatlar va to'lov ---- */
  ['Tekshirilmoqda', 'Under review', 'На проверке'], ['Qabul qilindi', 'Accepted', 'Принят'], ["Yo'lda", 'On the way', 'В пути'], ['Topshirildi', 'Delivered', 'Доставлен'],
  ['Rad etildi', 'Rejected', 'Отклонено'], ['Bekor qilindi', 'Cancelled', 'Отменён'], ["To'liq to'lov", 'Full payment', 'Полная оплата'], ['Naqd', 'Cash', 'Наличные'],
  ['Tekshiruvda', 'Under review', 'На проверке'], ['Tasdiqlandi', 'Confirmed', 'Подтверждено'], ["Boshlang'ich to'lov", 'Down payment', 'Первый взнос'],
  ["Nasiya to'lovi", 'Installment payment', 'Платёж по рассрочке'], ["nasiya to'lovi", 'installment payment', 'платёж по рассрочке'],
  ['Mahsulot', 'Product', 'Товар'], ['Narx', 'Price', 'Цена'], ['Soni', 'Qty', 'Кол-во'], ['Summa', 'Amount', 'Сумма'], ['Jami', 'Total', 'Итого'],
  ['Admin kiritdi', 'Entered by admin', 'Внесено администратором'],

  /* ---- kirish ---- */
  ['Kirish', 'Sign in', 'Вход'], ['Akkaunt yaratish', 'Create account', 'Регистрация'], ['Akkaunt nomi', 'Username', 'Логин'], ['Parol', 'Password', 'Пароль'],
  ['Admin panelga kirish', 'Admin sign-in', 'Вход для администратора'], ['Admin logini', 'Admin login', 'Логин администратора'], ["Do'konga qaytish", 'Back to the shop', 'Вернуться в магазин'],
  ["Parolni ko'rsatish", 'Show password', 'Показать пароль'], ['Lotin harflari, raqam, nuqta yoki _ (3–20 ta belgi)', 'Latin letters, digits, dot or _ (3–20 characters)', 'Латинские буквы, цифры, точка или _ (3–20 символов)'],
  ['kamida 6 ta belgi', 'at least 6 characters', 'не менее 6 символов'], ['Ism', 'Name', 'Имя'], ['Telefon raqam', 'Phone number', 'Номер телефона'], ['Viloyat', 'Region', 'Область'], ['Tanlang…', 'Choose…', 'Выберите…'],
  ['Manzil (ixtiyoriy)', 'Address (optional)', 'Адрес (необязательно)'], ["Tuman, ko'cha, uy", 'District, street, house', 'Район, улица, дом'], ["Savol bo'lsa", 'Questions?', 'Есть вопросы?'],
  ['Akkaunt nomi va parolni kiriting', 'Enter your username and password', 'Введите логин и пароль'], ["Bu nom bo'sh", 'This username is available', 'Логин свободен'], ['Bu nom band, boshqasini tanlang', 'This username is taken, choose another', 'Логин занят, выберите другой'],
  ["Akkaunt nomini to'g'ri kiriting", 'Enter a valid username', 'Введите корректный логин'], ["Parol kamida 6 ta belgi bo'lsin", 'Password must be at least 6 characters', 'Пароль — не менее 6 символов'],
  ['Ismingizni kiriting', 'Enter your name', 'Введите имя'], ["Telefon raqamni to'liq kiriting", 'Enter the full phone number', 'Введите номер телефона полностью'], ['Viloyatni tanlang', 'Choose a region', 'Выберите область'],

  /* ---- katalog ---- */
  ['Qolmadi', 'Sold out', 'Нет в наличии'], ["Qo'lda to'qilgan", 'Handwoven', 'Икат-одежда'], ['ikat kiyimlar', 'ikat clothing', 'ручной работы'],
  ["Nomi, matosi yoki o'lchami", 'Name, fabric or size', 'Название, ткань или размер'], ['{0} ta mahsulot', 'Products: {0}', 'Товаров: {0}'], ['{0}-rasm', 'Image {0}', 'Фото {0}'],
  ['Kolleksiya tayyorlanmoqda', 'The collection is being prepared', 'Коллекция готовится'], ["Mahsulotlar tez orada shu yerda paydo bo'ladi.", 'Products will appear here soon.', 'Товары скоро появятся здесь.'],
  ["Hozircha yangilik yo'q", 'Nothing new yet', 'Пока нет новинок'], ['Hech narsa topilmadi', 'Nothing found', 'Ничего не найдено'], ["Boshqa so'z bilan qidirib ko'ring", 'Try a different search', 'Попробуйте другой запрос'], ["Boshqa bo'limni tanlang", 'Choose another category', 'Выберите другой раздел'],
  ['Hozircha qolmagan', 'Out of stock', 'Нет в наличии'], ["O'lchamni tanlang", 'Choose a size', 'Выберите размер'], ["Bu o'lcham qolmagan", 'This size is sold out', 'Этого размера нет'], ['Mavjud', 'In stock', 'В наличии'], ["O'lcham", 'Size', 'Размер'],
  ['Oxirgi {0}', 'Only {0} left', 'Осталось {0}'], ['Faqat {0} qolgan', 'Only {0} left', 'Осталось только {0}'], ['Kamaytirish', 'Decrease', 'Уменьшить'], ["Ko'paytirish", 'Increase', 'Увеличить'], ['Miqdor', 'Quantity', 'Количество'],
  ["Savatga qo'shish", 'Add to cart', 'В корзину'], ["Savatga qo'shildi", 'Added to cart', 'Добавлено в корзину'], ["Savatda {0} · o'tish", 'In cart: {0} · open', 'В корзине: {0} · перейти'],

  /* ---- savat va to'lov oynasi ---- */
  ["Savat bo'sh", 'Your cart is empty', 'Корзина пуста'], ['Katalogdan yoqqan kiyimni tanlang', 'Pick something you like from the catalog', 'Выберите что-нибудь в каталоге'], ["Katalogga o'tish", 'Go to catalog', 'Перейти в каталог'],
  ['Yetkazish manzili', 'Delivery address', 'Адрес доставки'], ['Yetkazish manzilini kiriting', 'Enter the delivery address', 'Введите адрес доставки'], ['Izoh (ixtiyoriy)', 'Comment (optional)', 'Комментарий (необязательно)'], ["To'lash", 'Pay', 'Оплатить'], ['Nasiyaga olish', 'Buy in installments', 'Купить в рассрочку'],
  ['Savatni tozalash', 'Clear cart', 'Очистить корзину'], ['Barcha mahsulotlar savatdan olib tashlanadi.', 'All items will be removed from the cart.', 'Все товары будут удалены из корзины.'], ["Qoldiq o'zgargani uchun savat yangilandi", 'Stock has changed, so your cart was updated', 'Остатки изменились, корзина обновлена'],
  ["To'lov", 'Payment', 'Оплата'], ['Nasiya limiti', 'Installment limit', 'Лимит рассрочки'], ['Nasiyalarim', 'My installments', 'Мои рассрочки'], ['Nasiya shartlari', 'Installment terms', 'Условия рассрочки'], ['Hozir', 'Now', 'Сейчас'], ['{0} kun ichida', 'Within {0} days', 'В течение {0} дн.'],
  ["Sizda {0} ta nasiya bor. Bir vaqtda ko'pi bilan {1} ta bo'lishi mumkin. Avval mavjud nasiyani to'lang.", 'You have {0} open installment plan(s). The maximum at one time is {1}. Please pay off an existing one first.', 'У вас открытых рассрочек: {0}. Одновременно можно не более {1}. Сначала погасите имеющуюся.'],
  ["Bir vaqtda ko'pi bilan {0} ta nasiya.", 'No more than {0} installment plan(s) at a time.', 'Одновременно не более рассрочек: {0}.'],
  ["Boshlang'ich to'lov tasdiqlangach buyurtma qabul qilinadi.", 'The order is accepted once the down payment is confirmed.', 'Заказ принимается после подтверждения первого взноса.'],
  ["Qolgan summani «Nasiya» bo'limida bo'lib-bo'lib to'lashingiz mumkin.", 'You can pay the rest in parts in the «Installments» section.', 'Остаток можно оплачивать частями в разделе «Рассрочка».'],
  ["Roziman: qolgan summani belgilangan muddat ichida to'liq to'layman.", 'I agree to pay the remaining amount in full within the set period.', 'Согласен(на): полностью оплачу остаток в установленный срок.'],
  ['Buyurtma №{0} yuborildi', 'Order №{0} sent', 'Заказ №{0} отправлен'],
  ["Chek tekshirilmoqda. Tasdiqlangach buyurtma qabul qilinadi va qolgan summa «Nasiya» bo'limida ko'rinadi.", 'Your receipt is being checked. Once confirmed, the order is accepted and the balance appears in «Installments».', 'Чек проверяется. После подтверждения заказ будет принят, а остаток появится в разделе «Рассрочка».'],
  ["Chek tekshirilmoqda. Tasdiqlangach buyurtma qabul qilinadi — holati «Profil» bo'limida ko'rinadi.", 'Your receipt is being checked. Once confirmed, the order is accepted — see its status in «Profile».', 'Чек проверяется. После подтверждения заказ будет принят — статус виден в разделе «Профиль».'],
  ["To'lov summasi (so'm)", 'Payment amount (UZS)', 'Сумма платежа (сум)'], ["Ko'pi bilan", 'Maximum', 'Максимум'], ["To'lov usuli", 'Payment method', 'Способ оплаты'], ["To'lov cheki", 'Payment receipt', 'Чек об оплате'],
  ['Chek rasmini yuklang', 'Upload the receipt image', 'Загрузите фото чека'], ['Skrinshot yoki foto', 'Screenshot or photo', 'Скриншот или фото'], ['Chek rasmi', 'Receipt image', 'Фото чека'], ["To'lovni yuborish", 'Send payment', 'Отправить оплату'], ['Nusxalash', 'Copy', 'Копировать'], ['Qabul qiluvchi', 'Recipient', 'Получатель'],
  ['{0} da ochish', 'Open in {0}', 'Открыть в {0}'], ['{0} rekvizitlari hali kiritilmagan.', '{0} payment details have not been added yet.', 'Реквизиты {0} ещё не указаны.'], ['Aloqa', 'Contact', 'Контакты'], ['Karta raqami nusxalandi', 'Card number copied', 'Номер карты скопирован'],
  ['Chek yuklandi · almashtirish uchun bosing', 'Receipt added · tap to replace', 'Чек загружен · нажмите, чтобы заменить'],

  /* ---- borib olish / online ---- */
  ['Qanday olasiz?', 'How will you get it?', 'Как хотите получить?'], ['Borib olish', 'Store pickup', 'Самовывоз'], ['Online olish', 'Online order', 'Онлайн-заказ'], ["To'lov do'konda", 'Pay in store', 'Оплата в магазине'], ["Yetkazib berish, onlayn to'lov", 'Delivery, online payment', 'Доставка, онлайн-оплата'],
  ['Buyurtma berish', 'Place order', 'Оформить заказ'], ["Do'kon manzili", 'Store address', 'Адрес магазина'], ["Do'kon manzilini buyurtma tasdiqlangach aytamiz", 'We will tell you the store address once the order is confirmed', 'Адрес магазина сообщим после подтверждения заказа'],
  ["Jami {0}. To'lovni mahsulotni olayotganda do'konda qilasiz.", 'Total {0}. You pay in the store when you collect the items.', 'Итого {0}. Оплата в магазине при получении.'],
  ["Do'kon buyurtmani tasdiqlagach borib olishingiz mumkin. Holati «Buyurtmalar» bo'limida ko'rinadi.", 'You can collect it once the store confirms the order. See its status in «Orders».', 'Забрать заказ можно после подтверждения магазином. Статус виден в разделе «Заказы».'],
  ["Chek tekshirilmoqda. Tasdiqlangach buyurtma qabul qilinadi — holati «Buyurtmalar» bo'limida ko'rinadi.", 'Your receipt is being checked. Once confirmed, the order is accepted — see its status in «Orders».', 'Чек проверяется. После подтверждения заказ будет принят — статус виден в разделе «Заказы».'],
  ['Buyurtmalar', 'Orders', 'Заказы'], ["Buyurtma yo'q", 'No orders', 'Заказов нет'], ["Savatda «Borib olish» ni tanlang: to'lovni do'konda qilasiz.", 'Choose «Store pickup» in the cart and pay in the store.', 'Выберите «Самовывоз» в корзине: оплата в магазине.'], ["Savatda «Online olish» ni tanlang: yetkazib beramiz.", 'Choose «Online order» in the cart and we will deliver it.', 'Выберите «Онлайн-заказ» в корзине: мы доставим.'],
  ["Do'kon tasdiqlashini kuting", 'Waiting for the store to confirm', 'Ожидайте подтверждения магазина'], ["Borib olishingiz mumkin. To'lov do'konda.", 'Ready to collect. Pay in the store.', 'Можно забирать. Оплата в магазине.'],
  ['Buyurtmani rad etish', 'Reject order', 'Отклонить заказ'], ["Topshirildi, pul olindi", 'Handed over, paid', 'Выдан, оплачен'], ["Do'kon manzili (borib olish uchun)", 'Store address (for pickup)', 'Адрес магазина (для самовывоза)'], ["Shahar, tuman, ko'cha, mo'ljal", 'City, district, street, landmark', 'Город, район, улица, ориентир'], ["Nasiya endi yo'q", 'Installments are no longer available', 'Рассрочки больше нет'],

  /* ---- nasiya, profil ---- */
  ["Boshlang'ich to'lov tekshirilmoqda", 'Down payment is being checked', 'Первый взнос проверяется'], ['Muddat: {0} · {1} kun qoldi', 'Due: {0} · {1} day(s) left', 'Срок: {0} · осталось {1} дн.'], ["Muddati {0} kun oldin o'tgan ({1})", 'Overdue by {0} day(s) ({1})', 'Просрочено на {0} дн. ({1})'],
  ['Qolgan summa', 'Remaining amount', 'Остаток'], ['Buyurtma', 'Order', 'Заказ'], ["To'langan", 'Paid', 'Оплачено'], ['Qoldiq', 'Remaining', 'Остаток'], ['Tafsilot', 'Details', 'Подробнее'], ["Nasiya yo'q", 'No installments', 'Рассрочек нет'],
  ["Savatda «Nasiyaga olish» tugmasi orqali {0}% to'lab buyurtma berishingiz mumkin.", 'You can order by paying {0}% with the «Buy in installments» button in the cart.', 'Вы можете заказать, оплатив {0}%, через кнопку «Купить в рассрочку» в корзине.'], ["Hozircha to'lanmagan nasiyangiz yo'q.", 'You have no unpaid installments.', 'У вас нет непогашенных рассрочек.'],
  ["To'lov yuborildi", 'Payment sent', 'Платёж отправлен'], ['Chekingiz tekshirilmoqda. Tasdiqlangach qoldiq kamayadi.', 'Your receipt is being checked. The balance will go down once it is confirmed.', 'Чек проверяется. После подтверждения остаток уменьшится.'], ["Chekni ko'rish", 'View receipt', 'Посмотреть чек'],
  ['Manzil', 'Address', 'Адрес'], ['Izoh', 'Comment', 'Комментарий'], ["To'lovlar", 'Payments', 'Платежи'], ["Qo'ng'iroq", 'Call', 'Позвонить'], ['Profil rasmini tanlash', 'Choose a profile picture', 'Выбрать фото профиля'], ['Telefon', 'Phone', 'Телефон'], ['Buyurtmalarim', 'My orders', 'Мои заказы'],
  ['Chiqish', 'Sign out', 'Выйти'], ['Chiqdingiz', 'You have signed out', 'Вы вышли'], ['Rasm yangilandi', 'Picture updated', 'Фото обновлено'], ['Akkauntdan chiqmoqchimisiz?', 'Do you want to sign out?', 'Выйти из аккаунта?'], ['qoldiq', 'remaining', 'остаток'], ['Hali buyurtma bermagansiz', 'You have no orders yet', 'У вас пока нет заказов'],
  ["Ma'lumotlarim", 'My details', 'Мои данные'], ["Parolni o'zgartirish", 'Change password', 'Смена пароля'], ['Eski parol', 'Old password', 'Старый пароль'], ['Yangi parol', 'New password', 'Новый пароль'], ['Yangi parolni takrorlang', 'Repeat the new password', 'Повторите новый пароль'],
  ["Yangi parol kamida 6 ta belgi bo'lsin", 'The new password must be at least 6 characters', 'Новый пароль — не менее 6 символов'], ['Yangi parollar bir xil emas', 'The new passwords do not match', 'Новые пароли не совпадают'], ["Parol o'zgartirildi", 'Password changed', 'Пароль изменён'],

  /* ---- admin ---- */
  ['Bugun', 'Today', 'Сегодня'], ['Tarix', 'History', 'История'], ['Mijozlar', 'Customers', 'Клиенты'], ['Sozlama', 'Settings', 'Настройки'],
  ['Chekni rad etish', 'Reject receipt', 'Отклонить чек'], ['Buyurtma bekor qilinadi va mahsulotlar omborga qaytadi.', 'The order will be cancelled and the items returned to stock.', 'Заказ будет отменён, товары вернутся на склад.'], ["Bu to'lov rad etiladi.", 'This payment will be rejected.', 'Этот платёж будет отклонён.'], ['Rad etish', 'Reject', 'Отклонить'], ['Rad', 'Reject', 'Отклонить'], ['Tasdiqlash', 'Confirm', 'Подтвердить'],
  ['Mijoz', 'Customer', 'Клиент'], ['Muddat', 'Due date', 'Срок'], ['Shartga rozilik', 'Terms accepted', 'Согласие с условиями'], ["Yo'lga chiqdi", 'Shipped', 'Отправлен'], ["Naqd to'lov", 'Cash payment', 'Оплата наличными'], ["Naqd to'lov qo'shildi", 'Cash payment added', 'Оплата наличными добавлена'], ['Bekor qilish', 'Cancel order', 'Отменить заказ'], ['Buyurtmani bekor qilish', 'Cancel order', 'Отмена заказа'],
  ["Mahsulotlar omborga qaytadi. To'langan pulni mijozga o'zingiz qaytarasiz.", 'Items return to stock. You refund the customer yourself.', 'Товары вернутся на склад. Деньги клиенту вы возвращаете сами.'], ["Summa (so'm)", 'Amount (UZS)', 'Сумма (сум)'],
  ['Bugungi zakaz', 'Orders today', 'Заказы сегодня'], ['Bugungi summa', 'Sum today', 'Сумма сегодня'], ["Nasiya qoldig'i", 'Installments due', 'Долг по рассрочке'], ["Birinchi mahsulotni qo'shing", 'Add your first product', 'Добавьте первый товар'], ["Do'kon hozircha bo'sh. Rasm, o'lcham va narxni kiriting — mijozlarga darrov ko'rinadi.", 'The shop is empty for now. Add a picture, sizes and price — customers will see it right away.', 'Магазин пока пуст. Добавьте фото, размеры и цену — клиенты сразу увидят товар.'],
  ["Mahsulot qo'shish", 'Add product', 'Добавить товар'], ['Tasdiqlash kutilmoqda', 'Awaiting confirmation', 'Ожидают подтверждения'], ["Bugun hali zakaz yo'q", 'No orders yet today', 'Сегодня заказов ещё нет'], ['Bugungi zakazlar', "Today's orders", 'Заказы за сегодня'],
  ['Mahsulotlar', 'Products', 'Товары'], ['Oylik foyda', 'Monthly profit', 'Прибыль по месяцам'], ['Mahsulot qidirish', 'Search products', 'Поиск товара'], ['Yangi mahsulot', 'New product', 'Новый товар'], ['yashirin', 'hidden', 'скрыт'], ['qolmagan', 'out of stock', 'нет'], ['jami', 'total', 'всего'], ["Hali mahsulot yo'q", 'No products yet', 'Товаров пока нет'], ["Yuqoridagi tugma orqali birinchisini qo'shing", 'Add the first one with the button above', 'Добавьте первый кнопкой выше'],
  ['{0} ta · sotuvda {1}', '{0} total · {1} on sale', 'Всего {0} · в продаже {1}'], ['{0} ta', '{0}', '{0}'], ['{0} ta mijoz', 'Customers: {0}', 'Клиентов: {0}'],
  ['Rasmlar', 'Images', 'Фото'], ["Birinchi rasm — muqova. Almashtirish uchun rasmni bosing. Ko'pi bilan 8 ta.", 'The first image is the cover. Tap another image to make it the cover. Up to 8.', 'Первое фото — обложка. Нажмите на другое, чтобы сделать его обложкой. Не более 8.'], ['Nomi', 'Name', 'Название'], ["Adras ko'ylak", 'Adras dress', 'Платье из адраса'], ["Bo'lim", 'Category', 'Раздел'], ["Bo'limsiz", 'No category', 'Без раздела'], ['Matosi', 'Fabric', 'Ткань'], ['Adras, atlas, baxmal', 'Adras, atlas, velvet', 'Адрас, атлас, бархат'],
  ["Narxi (so'm)", 'Price (UZS)', 'Цена (сум)'], ["Tan narxi (so'm)", 'Cost (UZS)', 'Себестоимость (сум)'], ['foyda hisobi uchun', 'to calculate profit', 'для расчёта прибыли'], ["O'lcham va qoldiq", 'Sizes and stock', 'Размеры и остаток'], ["O'lchamli", 'With sizes', 'С размерами'], ["O'lchamsiz", 'No sizes', 'Без размеров'], ['Tavsif (ixtiyoriy)', 'Description (optional)', 'Описание (необязательно)'], ['Bichimi, parvarishi, uzunligi…', 'Fit, care, length…', 'Крой, уход, длина…'],
  ["«Yangi» belgisi bilan ko'rsatish", 'Show with a «New» badge', 'Показывать с меткой «Новинки»'], ["Mijozlarga ko'rinsin", 'Visible to customers', 'Показывать клиентам'], ['Muqova', 'Cover', 'Обложка'], ['Muqova qilish', 'Make cover', 'Сделать обложкой'], ['Rasmni olib tashlash', 'Remove image', 'Убрать фото'], ['Rasm', 'Image', 'Фото'], ["Rasm qo'shish", 'Add image', 'Добавить фото'], ['Birlik', 'Unit', 'Единица'], ['metr (mato)', 'metre (fabric)', 'метр (ткань)'],
  ["O'lchamni olib tashlash", 'Remove size', 'Убрать размер'], ["Bor o'lchamlarni tanlang, keyin har birining sonini yozing", 'Choose the available sizes, then enter the quantity of each', 'Выберите имеющиеся размеры и укажите количество каждого'], ['Rasmlar yuklanmoqda, biroz kuting', 'Images are uploading, please wait', 'Фото загружаются, подождите'], ['Mahsulot nomini kiriting', 'Enter the product name', 'Введите название товара'], ['Narxini kiriting', 'Enter the price', 'Введите цену'], ["Kamida bitta o'lcham tanlang yoki «O'lchamsiz» ni bosing", 'Choose at least one size or tap «No sizes»', 'Выберите хотя бы один размер или нажмите «Без размеров»'],
  ["Mahsulotni o'chirish", 'Delete product', 'Удаление товара'], ["«{0}» butunlay o'chiriladi. Vaqtincha olib turish uchun «Mijozlarga ko'rinsin» belgisini olib tashlash kifoya.", '«{0}» will be deleted permanently. To hide it for a while, just untick «Visible to customers».', '«{0}» будет удалён навсегда. Чтобы временно скрыть, снимите отметку «Показывать клиентам».'],
  ['Zakazlar', 'Orders', 'Заказы'], ['Sotuv', 'Sales', 'Продажи'], ['Foyda', 'Profit', 'Прибыль'], ['Kelgan pul', 'Money received', 'Поступления'], ["Foyda = sotuv − tan narxi. Hisobot o'zi yangilanib boradi.", 'Profit = sales − cost. The report updates automatically.', 'Прибыль = продажи − себестоимость. Отчёт обновляется сам.'], ['{0} ta sotuvda tan narxi kiritilmagan — foyda aniq emas.', 'Cost is missing for {0} sale(s) — the profit is not exact.', 'Себестоимость не указана в продажах: {0} — прибыль неточная.'], ["Hisobotni o'chirish", 'Delete report', 'Удаление отчёта'], ["{0} hisoboti o'chiriladi.", 'The {0} report will be deleted.', 'Отчёт за {0} будет удалён.'],
  ['Buyurtmalar tarixi', 'Order history', 'История заказов'], ['Dan', 'From', 'С'], ['Gacha', 'To', 'По'], ['Holat', 'Status', 'Статус'], ['ism, telefon', 'name, phone', 'имя, телефон'], ['Buyurtma topilmadi', 'Order not found', 'Заказ не найден'], ["Yuklash uchun buyurtma yo'q", 'No orders to download', 'Нет заказов для выгрузки'], ['Sana', 'Date', 'Дата'], ['Turi', 'Type', 'Тип'], ["To'liq", 'Full', 'Полная'],
  ['Nasiyalar', 'Installments', 'Рассрочки'], ['Jami qoldiq', 'Total remaining', 'Общий остаток'], ['Ism, akkaunt yoki telefon', 'Name, username or phone', 'Имя, логин или телефон'], ['Mijoz qidirish', 'Search customers', 'Поиск клиента'], ['bloklangan', 'blocked', 'заблокирован'], ['nasiya', 'installment', 'рассрочка'], ['buyurtma', 'orders', 'заказов'], ["Mijoz yo'q", 'No customers', 'Клиентов нет'],
  ['ulangan', 'connected', 'подключён'], ['ulanmagan', 'not connected', 'не подключён'], ['Bloklash', 'Block', 'Заблокировать'], ['Blokdan chiqarish', 'Unblock', 'Разблокировать'], ['Bloklandi', 'Blocked', 'Заблокирован'], ['Blokdan chiqarildi', 'Unblocked', 'Разблокирован'], ['Mijozni bloklash', 'Block customer', 'Блокировка клиента'], ["{0} do'konga kira olmaydi.", '{0} will not be able to enter the shop.', '{0} не сможет войти в магазин.'], ["Hali buyurtma yo'q", 'No orders yet', 'Заказов пока нет'], ['Akkaunt', 'Account', 'Аккаунт'], ["Ro'yxatdan o'tgan", 'Registered', 'Регистрация'], ['Nasiyaga rozilik', 'Installment consent', 'Согласие на рассрочку'], ['Xaridlar', 'Purchases', 'Покупки'], ['Buyurtmalari', 'Orders', 'Заказы'], ['Mijoz uchun yangi parol', 'New password for the customer', 'Новый пароль для клиента'],
  ['Karta yoki telefon raqam', 'Card or phone number', 'Номер карты или телефона'], ['Havola (ixtiyoriy)', 'Link (optional)', 'Ссылка (необязательно)'], ['bot tokeni kiritilmagan', 'bot token is not set', 'токен бота не указан'], ['WhatsApp raqam', 'WhatsApp number', 'Номер WhatsApp'], ["Boshlang'ich %", 'Down payment %', 'Первый взнос %'], ['Muddat (kun)', 'Term (days)', 'Срок (дней)'], ['Telegram xabarnomalari', 'Telegram notifications', 'Уведомления в Telegram'], ['Telegramga ulash', 'Connect Telegram', 'Подключить Telegram'], ["Bo'limlar", 'Categories', 'Разделы'], ["To'lov rekvizitlari", 'Payment details', 'Реквизиты для оплаты'], ['Mijozlar nasiyaga buyurtma bera olsin', 'Allow customers to order in installments', 'Разрешить заказы в рассрочку'], ['Rozilik matni', 'Consent text', 'Текст согласия'], ["Bo'lim nomi", 'Category name', 'Название раздела'], ["Bo'limni olib tashlash", 'Remove category', 'Убрать раздел'], ["Bo'lim qo'shish", 'Add category', 'Добавить раздел'], ['Admin paneldan chiqasizmi?', 'Sign out of the admin panel?', 'Выйти из панели администратора?'], ['Sozlamalar saqlandi', 'Settings saved', 'Настройки сохранены'],
  ["Botga quyidagi xabarni yuboring ({0} daqiqa amal qiladi). Shundan keyin yangi buyurtma va cheklar o'sha chatga keladi.", 'Send the message below to the bot (valid for {0} minutes). New orders and receipts will then arrive in that chat.', 'Отправьте боту сообщение ниже (действует {0} мин.). После этого новые заказы и чеки будут приходить в тот чат.'],

  /* ---- boshlang'ich bo'limlar va viloyatlar ---- */
  ["Ko'ylaklar", 'Dresses', 'Платья'], ['Chopon va kardiganlar', 'Chapans and cardigans', 'Чапаны и кардиганы'], ['Bluzkalar', 'Blouses', 'Блузки'], ['Kostyumlar', 'Suits', 'Костюмы'], ['Matolar', 'Fabrics', 'Ткани'], ['Aksessuarlar', 'Accessories', 'Аксессуары'],
  ['Toshkent shahri', 'Tashkent city', 'город Ташкент'], ['Toshkent viloyati', 'Tashkent region', 'Ташкентская область'], ['Andijon', 'Andijan', 'Андижан'], ['Buxoro', 'Bukhara', 'Бухара'], ["Farg'ona", 'Fergana', 'Фергана'], ['Jizzax', 'Jizzakh', 'Джизак'], ['Xorazm', 'Khorezm', 'Хорезм'], ['Namangan', 'Namangan', 'Наманган'], ['Navoiy', 'Navoi', 'Навои'], ['Qashqadaryo', 'Kashkadarya', 'Кашкадарья'], ["Qoraqalpog'iston", 'Karakalpakstan', 'Каракалпакстан'], ['Samarqand', 'Samarkand', 'Самарканд'], ['Sirdaryo', 'Syrdarya', 'Сырдарья'], ['Surxondaryo', 'Surkhandarya', 'Сурхандарья'],

  /* ---- serverdan keladigan xabarlar ---- */
  ["Akkaunt nomi yoki parol noto'g'ri", 'Wrong username or password', 'Неверный логин или пароль'], ['Qaytadan kiring', 'Please sign in again', 'Войдите заново'], ["Ruxsat yo'q", 'Access denied', 'Нет доступа'], ['Akkaunt bloklangan.', 'This account is blocked.', 'Аккаунт заблокирован.'],
  ["Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.", 'Too many attempts. Please try again a little later.', 'Слишком много попыток. Попробуйте чуть позже.'], ["Rasm noto'g'ri formatda (JPG/PNG)", 'Wrong image format (JPG/PNG)', 'Неверный формат изображения (JPG/PNG)'], ['Rasm juda katta (3 MB dan oshmasin)', 'The image is too large (3 MB maximum)', 'Изображение слишком большое (до 3 МБ)'], ['Rasm juda katta', 'The image is too large', 'Изображение слишком большое'],
  ["Telefon raqam noto'g'ri (9 ta raqam kiriting)", 'Invalid phone number (enter 9 digits)', 'Неверный номер телефона (введите 9 цифр)'], ["Parol kamida 6 ta belgidan iborat bo'lsin", 'Password must be at least 6 characters', 'Пароль — не менее 6 символов'], ['Parol juda uzun', 'The password is too long', 'Пароль слишком длинный'], ['Akkaunt nomi 3–20 ta belgi: lotin harflari, raqam, nuqta yoki _', 'Username: 3–20 characters — Latin letters, digits, dot or _', 'Логин: 3–20 символов — латинские буквы, цифры, точка или _'], ['Bu akkaunt nomi band, boshqasini tanlang', 'This username is taken, choose another', 'Логин занят, выберите другой'], ['Bu akkaunt nomi band', 'This username is taken', 'Логин занят'], ["Admin nomini o'zgartirib bo'lmaydi", 'The admin username cannot be changed here', 'Логин администратора здесь изменить нельзя'], ["Eski parol noto'g'ri", 'The old password is wrong', 'Старый пароль неверен'],
  ['Admin buyurtma bera olmaydi', 'The admin cannot place orders', 'Администратор не может делать заказы'], ["To'lov usulini tanlang", 'Choose a payment method', 'Выберите способ оплаты'], ["Juda ko'p mahsulot", 'Too many items', 'Слишком много товаров'], ["Nasiya hozircha yo'q", 'Installments are not available now', 'Рассрочка пока недоступна'], ["Shartlarga rozilik belgisini qo'ying", 'Please accept the terms', 'Примите условия'], ["Savatdagi mahsulot endi sotuvda yo'q", 'An item in your cart is no longer on sale', 'Товар из корзины больше не продаётся'], ['Mahsulot takrorlangan', 'Duplicate item', 'Товар повторяется'], ["Miqdor noto'g'ri", 'Invalid quantity', 'Неверное количество'],
  ["Bu buyurtma bo'yicha nasiya yo'q", 'This order has no installment balance', 'По этому заказу нет рассрочки'], ["Bu buyurtmada nasiya yo'q", 'This order has no installment balance', 'По этому заказу нет рассрочки'], ["To'lov summasini kiriting", 'Enter the payment amount', 'Введите сумму платежа'], ["To'lov topilmadi", 'Payment not found', 'Платёж не найден'], ["Bu to'lov allaqachon ko'rib chiqilgan", 'This payment has already been processed', 'Этот платёж уже обработан'], ["Noto'g'ri amal", 'Invalid action', 'Неверное действие'], ["Holatni bunday o'zgartirib bo'lmaydi", 'This status change is not allowed', 'Так изменить статус нельзя'], ['Mijoz topilmadi', 'Customer not found', 'Клиент не найден'],
  ["Kamida bitta o'lcham yoki qoldiq kiriting", 'Enter at least one size or the stock', 'Укажите хотя бы один размер или остаток'], ["O'lcham nomini kiriting", 'Enter the size name', 'Введите название размера'], ["Qoldiq noto'g'ri", 'Invalid stock', 'Неверный остаток'], ["Narx noto'g'ri", 'Invalid price', 'Неверная цена'], ["Tan narxi noto'g'ri", 'Invalid cost', 'Неверная себестоимость'], ['Rasm topilmadi, qaytadan yuklang', 'Image not found, upload it again', 'Фото не найдено, загрузите снова'], ["Noto'g'ri oy", 'Invalid month', 'Неверный месяц'], ["Nasiya sozlamalari noto'g'ri", 'Invalid installment settings', 'Неверные настройки рассрочки'], ["Server xatosi, qayta urinib ko'ring", 'Server error, please try again', 'Ошибка сервера, попробуйте снова'], ['Server ishga tushmoqda…', 'The server is starting…', 'Сервер запускается…']
];

/* O'zgaruvchan qismli server xabarlari: [uz andoza, en, ru] */
const I18N_ERR = [
  ["Akkaunt bloklangan. Aloqa: {0}", 'This account is blocked. Contact: {0}', 'Аккаунт заблокирован. Контакт: {0}'],
  ["Sizda {0} ta olib ketilmagan buyurtma bor. Avval ularni olib keting.", 'You have {0} orders waiting for pickup. Please collect them first.', 'У вас незабранных заказов: {0}. Сначала заберите их.'],
  ["{0}: bu o'lcham endi yo'q", '{0}: this size is no longer available', '{0}: этого размера больше нет'],
  ['{0}: faqat {1} dona qolgan', '{0}: only {1} pcs left', '{0}: осталось только {1} шт.'],
  ['{0}: faqat {1} m qolgan', '{0}: only {1} m left', '{0}: осталось только {1} м'],
  ['{0}: afsuski qolmadi', '{0}: sorry, sold out', '{0}: к сожалению, закончился'],
  ["Summa qoldiqdan oshib ketdi (to'lash mumkin: {0} so'm)", 'The amount exceeds the balance (you can pay: {0} UZS)', 'Сумма больше остатка (можно оплатить: {0} сум)'],
  ["Summa noto'g'ri (kiritish mumkin: {0} so'm)", 'Invalid amount (maximum: {0} UZS)', 'Неверная сумма (максимум: {0} сум)'],
  ["«{0}» o'lchami takrorlangan", 'Size «{0}» is duplicated', 'Размер «{0}» повторяется'],
  ['{0} havolasi https:// bilan boshlansin', 'The {0} link must start with https://', 'Ссылка {0} должна начинаться с https://']
];

const LANGS = [['uz', 'UZ', "O'zbekcha"], ['en', 'EN', 'English'], ['ru', 'RU', 'Русский']];
const LANG = (() => {
  let l = null;
  try { l = localStorage.getItem('ikat_lang'); } catch { /* */ }
  return LANGS.some((x) => x[0] === l) ? l : 'uz';
})();
document.documentElement.lang = LANG;
const LANG_COL = { en: 1, ru: 2 }[LANG] || 0;
const I18N_MAP = new Map(I18N.map((r) => [r[0], r[LANG_COL]]));
const _fill = (s, a) => (a.length ? s.replace(/\{(\d)\}/g, (m, i) => (a[i] === undefined ? m : a[i])) : s);
function _t(s, ...a) { return _fill(I18N_MAP.get(s) ?? s ?? '', a); }

const I18N_RE = I18N_ERR.map((r) => [new RegExp('^' + r[0].replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\d\}/g, '(.+?)') + '$'), r[LANG_COL]]);
function _tErr(s) {
  if (!LANG_COL) return s;
  const hit = I18N_MAP.get(s);
  if (hit !== undefined) return hit;
  for (const [re, to] of I18N_RE) { const m = re.exec(s); if (m) return _fill(to, m.slice(1)); }
  return s;
}

/* ---------- Til tugmalari ---------- */
const langHtml = () => `<span class="langs" role="group" aria-label="${_t('Til')}">${LANGS.map(([id, short, full]) => `<button type="button" data-lang="${id}" class="${id === LANG ? 'on' : ''}" aria-label="${full}" aria-pressed="${id === LANG}">${short}</button>`).join('')}</span>`;

/** Til almashganda sahifa qayta ochiladi; foydalanuvchi turgan joyi va yozgan matni shu yerda saqlanadi */
const KEEP = (() => {
  try { const k = JSON.parse(sessionStorage.getItem('ikat_keep') || '{}'); sessionStorage.removeItem('ikat_keep'); return k || {}; } catch { return {}; }
})();
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-lang]');
  if (!b || b.dataset.lang === LANG) return;
  const keep = { lang: 1 };
  if (G.me) Object.assign(keep, { tab: G.me.role === 'admin' ? G.atab : G.tab, addr: G.addr, comment: G.comment, way: G.way });
  else {
    keep.mode = document.querySelector('#f-reg') ? 'reg' : 'login';
    keep.form = {};
    document.querySelectorAll('.auth-card [name]').forEach((i) => { if (i.type !== 'password' && i.name !== 'password') keep.form[i.name] = i.value; });
  }
  try { localStorage.setItem('ikat_lang', b.dataset.lang); sessionStorage.setItem('ikat_keep', JSON.stringify(keep)); } catch { /* */ }
  location.reload();
});
