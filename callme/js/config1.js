// настройка скрипта CallMe 2.1
// по-русски: dedushka.org // in English: nazarTokar.com // форум: qbx.me // a@dedushka.org
// updated on 2014-11-29

var cmeData = {
	// показывать кнопку справа? (1 - да, 0 - нет)
	"showButton": 	"1", 

	// укажите через запятую названия полей
	// textarea: ставьте перед названием минус (-)
	// select: ставьте перед названием "!" и разделяйте варианты для выбора таким же символом
	// checkbox: знак вопроса перед именем
	// если поле должно быть обязательно заполнено, после его название добавьте * (например, имя*)
	"fields": "Имя (Ваше имя), Телефон (Укажите телефон), -Вопрос (Желательно заполнить), !Ваш вопрос!Узнать наличие!Сделать заказ, ?Подарочная упаковка",

	// заголовок формы
	"title": "Заказать обратный звонок",

	// надпись на кнопке
	"button": "Перезвоните мне", 

	// показывать ли время звонка (1 - да, 0 - нет)
	"callTime": "1", 
	"txtCallTime": "Время звонка",
	"txtToday": "сегодня",
	"txtTmrw": "завтра",
	"txtTill": "до",
	"txtHours": "час.",

	"alertSending": "Идет отправка", // идет отправка
	"alertSetCallTime": "Укажите время звонка", // Укажите время звонка

	"mailReferrer": "Источник трафика", // откуда пришел посетитель
	"mailUrl": "Страница с запросом", // страница, откуда отправлен запрос

	// начало и конец рабочего дня в часах, используется для времени звонка
	"workStart": "8",
	"workEnd": "19",

	// центрировать форму на экране? (1 - центр экрана, 0 - у места клика)
	"center": "1",

	// шаблон (default, apple, vk, fb, blackred, pink)
	"template": "default",

	// лицензия (можно купить на get.nazartokar.com)
	"license": "0",
	"showCopyright": "1"
}