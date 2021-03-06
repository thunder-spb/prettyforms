// Класс для работы с формами сайта: валидация элементов формы, отправка данных на сервер и выполнение команд, полученных от сервера
PrettyForms = new function () {

    // HTML-шаблоны, используемые библиотекой
    this.templates = {
        // Контейнер, в который будут помещены сообщения об ошибках, относящиеся к определённому элементу
        element_validations_container: '<div style="display:none;margin-top:10px" id="validation-error-{%}" class="alert alert-danger" role="alert"></div>',
        // Сообщение об ошибке
        element_validation_message: '<p><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>&nbsp;{%}</p>',
        // Контейнер с перечислением общих ошибок, относящихся к форме, обязательно должен иметь класс .validation-errors
        form_validation_messages: '<div style="margin-bottom:10px" class="validation-errors alert alert-danger"></div>'
    };

    // Сообщения, используемые библиотекой
    this.messages = {
        server_error:  'Что-то пошло не так на сервере, и он не смог обработать ваши данные. Мы постараемся исправить это как можно скорее. Пожалуйста, повторите попытку позже.',
        really:        'Действительно выполнить действие?',
        fix_and_retry: 'Пожалуйста, исправьте ошибки в форме и повторите отправку.',
        rules: {
            notempty:  'Поле не может быть пустым.',
            minlength: 'Не менее {%} символов.',
            maxlength: 'Не более {%} символов.',
            hasdomain: 'Адрес должен начинаться с верного домена ({%})',
            isnumeric: 'Поле может содержать только цифры.',
            isemail:   'Должен быть введен корректный E-Mail',
            isurl:     'Должен быть введен корректный URL-адрес сайта.',
            isdate:    'Поле должно содержать дату',
            isphone:   'Введён не корректный формат телефона',
            minint:    'Минимальное вводимое число {%}',
            maxint:    'Максимальное вводимое число {%}',
            intonly:   'Можно ввести только число',
            passretry: 'Должно быть равно полю с паролем'
        }
    };

    // Небольшой класс, который занимается выполнением команд, получаемых с сервера
    this.Commands = new function () {
        this.handlers = {}; // Массив зарегистрированных обработчиков команд
        this.execute = function (command, params) {
            if (this.handlers[command]) {
                this.handlers[command](params);
            }
        };
        /**
         * Зарегистрировать обработчик команды, отправленной сервером
         * клиенту после обработки данных
         * @param string name
         * @param function action
         */
        this.registerHandler = function (name, action) {
            this.handlers[name] = action;
        };
    };

    // Класс для валидации объектов формы
    this.Validator = new function () {
        // Все правила валидации засунем в хеш, ключём будет название валидатора, значением - объект валидатор.
        this.validation_rules = {};

        /*
         Объект-валидатор создадим не описывая его класс отдельно.
         Поле error - текст ошибки выдаваемой пользователю.
         Поле validator - функция производящая валидацию.
         Функция должна принимать минимум один параметр - элемент для валидации.
         Второй, не обязательный параметр - "параметры валидации".
         Валидатор возвращает <b>TRUE</b> если нет ошибок.
         */

        // Валидатор, проверяющий элемент на "не пусто"
        this.validation_rules['notempty'] = function (el, val) {
            return val == null ? true : val.toString().length != 0;
        };

        // Валидатор проверяющий минимальное кол-во символов в элементе.
        this.validation_rules['minlength'] = function (el, val, length) {
            return val.toString().length >= length;
        };

        // Валидатор проверяющий максимальное кол-во символов в элементе.
        this.validation_rules['maxlength'] = function (el, val, length) {
            return val.toString().length <= length;
        };

        /*
         Проверяет наличие доменного имени в поле ввода, может принимать несколько параметров через запятую.
         domains="http://vk.com, http://vkontakte.ru"
         */
        this.validation_rules['hasdomain'] = function (el, val, domains) {
            if (val == '' || val == '(an empty string)') {
                return true;
            }
            domains = domains.split(',');
            for (var i in domains) {
                if (val.indexOf(domains[i].trim()) != -1)
                    return true;
            }
            return false;
        };

        // Валидатор, проверяющий что бы поле содержало только цифры
        this.validation_rules['isnumeric'] = function (el, val) {
            if (val == '' || val == '(an empty string)')
                return true;
            return /^[0-9]+$/.test(val);
        };

        // Проверяет корректность введённого емейла.
        this.validation_rules['isemail'] = function (el, val) {
            if (val == '' || val == '(an empty string)')
                return true;
            return /^.+@.+\..{2,9}$/.test(val);
        };

        this.validation_rules['isurl'] = function (el, val) {
            if (val == '' || val == '(an empty string)')
                return true;
            return /^(http|ftp|https):\/\/.+\..{2,9}/.test(val);
        };

        this.validation_rules['isdate'] = function (el, val) {
            if (val == '' || val == '(an empty string)')
                return true;
            if (!/^([0-9]{1,2})(\.|\/)([0-9]{1,2})(\.|\/)([0-9]{4,4})$/.test(val)) {
                return false;
            } else {
                return (parseInt(RegExp.$1) <= 31 && parseInt(RegExp.$3) <= 12 && parseInt(RegExp.$5) < 2500);
            }
        };

        this.validation_rules['isphone'] = function (el, val) {
            if (val == '' || val == '(an empty string)' || val == '(an empty string)')
                return true;
            return /^((8|\+7)?[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/.test(val)
        };

        this.validation_rules['minint'] = function (el, val, minInt) {
            if (val == '' || val == '(an empty string)')
                return true;
            return parseInt(val) >= parseInt(minInt);
        };

        this.validation_rules['maxint'] = function (el, val, minInt) {
            if (val == '' || val == '(an empty string)')
                return true;
            return parseInt(val) <= parseInt(minInt);
        };

        this.validation_rules['intonly'] = function (el, val) {
            if (val == '' || val == '(an empty string)')
                return true;
            return /^[0-9]+$/.test(val);
        };

        this.validation_rules['passretry'] = function (el, val, password_input_name) {
            if (typeof (password_input_name) === 'undefined') {
                password_input_name = 'password'; // По умолчанию осовной инпут с паролем называется "password"
            }
            return val === $('input[name="' + password_input_name + '"]').val();
        };

        /**
         * Добавить определённый валидатор
         * @param string rule_name Название правила валидации
         * @param function validator_func Функция валидации
         * @param string error_message Сообщение об ошибке, если валидация провалилась
         */
        this.setValidator = function(rule_name, error_message, validator_func) {
            this.validation_rules[rule_name] = validator_func;
            PrettyForms.messages.rules[rule_name] = error_message;
        }

        this.getElementErrorsContainer = function(el) {
            var el_input_name = el.attr('name');
            var el_errors_container = $('#validation-error-' + el_input_name);
            if (el_errors_container.length === 0) {
                // Если контейнер для ошибок не был найден на странице, добавим его
                el.after(PrettyForms.templates.element_validations_container.replace('{%}', el_input_name));
                el_errors_container = $('#validation-error-' + el_input_name);
            }
            return el_errors_container;
        };
        this.markElementAsChecked = function(el) {
            var el_errors_container = this.getElementErrorsContainer(el);
            el_errors_container.hide();
            // Если инпут находится внутри .form-group, будем работать с ним
            var el_form_group = el.closest('.form-group');
            if (el_form_group.length !== 0) {
                el_form_group.addClass('has-feedback');
                el_form_group.addClass('has-success').removeClass('has-warning');
                if (el.get(0).tagName === 'INPUT') {
                    el_form_group.find('span.glyphicon').remove();
                    el.after('<span class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>');
                }
            } else {
                el.css('border', '');
                el.css('box-shadow', '');
            }
        };
        this.markElementAsErroneous = function(el,error_messages,server_error) {
            var el_errors_container = this.getElementErrorsContainer(el);
            el_errors_container.html(error_messages).show();

            if (server_error === true) {
                el.addClass('validation-server-error');
            }

            // Если инпут находится внутри .form-group, будем работать с ним. Иначе вручную окрасим инпут красной рамкой.
            var el_form_group = el.closest('.form-group');
            if (el_form_group.length !== 0) {
                el_form_group.addClass('has-feedback');
                el_form_group.removeClass('has-success');
                el_form_group.find('span.glyphicon').remove();
                if (server_error !== true) {
                    el_form_group.addClass('has-warning');
                    if (el.get(0).tagName === 'INPUT') {
                        el.after('<span class="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>');
                    }
                }
            } else {
                el.css('border', '1px solid red');
                el.css('box-shadow', '0 0 5px rgba(255,0,0,0.5)');
            }

            el_errors_container.stop().css('opacity', '1').animate({opacity: 0.7}, 1500, 'linear');
        };

        this.validate = function (el) {

            // Функция непосредственной проверки элемента
            var checkElement = function (el) {
                var element_validation_rules = el.attr('data-validation').split(';');
                var element_rules_texts = '';
                var isError = false;

                // Перебираем все атрибуты валидации, прописанные к элементу
                for (var i in element_validation_rules) {
                    var el_validation_rule_name = element_validation_rules[i].toString().trim();

                    // Пробуем получить дополнительные параметры валидации
                    if (el_validation_rule_name.match(':')) {
                        var el_validation_rule_param = el_validation_rule_name.split(':');
                        el_validation_rule_name = el_validation_rule_param[0].toString().trim();
                        el_validation_rule_param = el_validation_rule_param[1].toString().trim();
                    }

                    // Достаём объект-валидатор по его названию и проверяем им объект.
                    var rule = PrettyForms.Validator.validation_rules[el_validation_rule_name];
                    if (typeof (rule) !== 'undefined') {
                        var element_value = el.val();

                        // Если это поле ввода большого текста, и к нему прикреплен редактор CKEditor, заберём данные его инстанс
                        if (el.get(0).tagName === 'TEXTAREA' && typeof (CKEDITOR) != 'undefined' && CKEDITOR.instances[el.attr('name')]) {
                            element_value = CKEDITOR.instances[el.attr('name')].getData();
                        }

                        // ПОМНИ! VALIDATOR ВЕРНЁТ TRUE ЕСЛИ ДАННЫЕ ВАЛИДНЫ
                        var el_validation_result = rule(el, element_value, el_validation_rule_param);
                        if (el_validation_result === false) {
                            isError = true;

                            var rule_text = PrettyForms.messages.rules[el_validation_rule_name].replace('{%}', el_validation_rule_param);
                            element_rules_texts += PrettyForms.templates.element_validation_message.replace('{%}', rule_text);
                        }
                    }
                }

                if (isError) {
                    return element_rules_texts;
                } else {
                    return true;
                }
            };

            // Если это скрытый элемент, к которому не применен некий JS-компонент, вроде плагина Chosen или CKEditor'а -  то не проверять его
            if (!el.is(':visible')
                    && !el.next().hasClass('chosen-container')
                    && !el.next().hasClass('cke')) {

                return true;
            }

            // У объекта нет правил валидации - нечего проверять
            if (!el.attr('data-validation')) {
                return true;
            }

            // Если элемент имеет данный класс, значит сервер сообщил об ошибке на нём.
            // Отключим проверку этого элемента.
            if (el.hasClass('validation-server-error')) {
                return false;
            }

            // Собственно, сама проверка элемента
            var isValid = checkElement(el);

            if (el.get(0).tagName === 'SELECT' && $(el).next().hasClass('chosen-container')) {
                el = el.next();
            }

            if (el.get(0).tagName === 'TEXTAREA' && $(el).next().hasClass('cke')) {
                el = el.next();
            }

            if (el.attr('type') == 'checkbox' || el.attr('type') == 'radio') {
                el = el.parent().parent().parent();
            }

            // Элемент проверен, ошибок нет
            if (isValid === true) {
                PrettyForms.Validator.markElementAsChecked(el);
                return true;
            } else {
                // Во время валидации элемента возникли ошибки,
                // Пометим элемент красным и сгенерируем небольшую анимацию
                PrettyForms.Validator.markElementAsErroneous(el,isValid);
                return false;
            }
        };
    };
    this.validation_errors_container = null;

    // Собрать данные из указанного контейнера, попутно проверив всех их валидатором
    this.getInputData = function (inputs_container) {
        if (typeof (inputs_container) !== 'undefined' && inputs_container !== '') {
            var form_values = {},
                    form_elements = this.getInputsList(inputs_container);

            var form_valid = true;
            form_elements.each(function (el) {
                var form_element = $(this),
                        element_value = undefined;

                // Имя есть - обрабатываем.
                if (form_element.attr('name') != undefined && form_element.attr('data-dontsend') !== 'true') {

                    if (!PrettyForms.Validator.validate(form_element)) {
                        if (form_valid) {
                            form_element.focus();
                        }
                        form_valid = false;
                    }

                    // Если имя имеет [] то шлём серверу массив.
                    if (form_element.attr('name').indexOf('[]') !== -1) {
                        // Если массив для хранения выбранных елементов не создан - создадим его.
                        if (typeof (form_values[form_element.attr('name')]) === 'undefined') {
                            form_values[form_element.attr('name')] = [];
                        }
                    }

                    if (form_element.attr('type') == 'checkbox' && form_element.is(':checked')) {
                        element_value = form_element.val();
                    } else if (form_element.attr('type') != 'checkbox') {
                        element_value = form_element.val();
                    }

                    // Если это textarea и к ней прикреплен редактор - получим значение элемента через инстанс CKEditor'а
                    if (form_element.get(0).tagName === 'TEXTAREA' && typeof (CKEDITOR) !== 'undefined' && CKEDITOR.instances[form_element.attr('name')]) {
                        element_value = CKEDITOR.instances[form_element.attr('name')].getData();
                    }

                    if (typeof (form_values[form_element.attr('name')]) === 'object' && typeof (element_value) !== 'undefined') {
                        form_values[form_element.attr('name')].push(element_value);
                    } else if (typeof (element_value) !== 'undefined') {
                        form_values[form_element.attr('name')] = element_value;
                    }
                }
            });

            if (form_valid) {
                return form_values;
            } else {
                return false;
            }
        }
    };

    // Вытащить все инпуты из указанного контейнера
    this.getInputsList = function (inputs_container) {
        return $(inputs_container).find('input[type="text"], input[type="email"], input[type="password"], input[type="hidden"], input[type="checkbox"], input[type="radio"]:checked, select, textarea');
    };

    /**
     * Отправить данные на определенный URL и обработать ответ
     * @param string url
     * @param object mass
     * @param object input_container (необязательно) контейнер, в котором необходимо будет очистить все инпуты от введенных данных
     */
    this.sendData = function (url, mass, input_container_for_clear, input) {
        // Запретим кликать повторно на нашу кнопочку, пока идёт отправка данных
        input.attr('disabled', 'disabled').addClass('disabled');
        setTimeout(function(){
            // Через 10 секунд включим её обратно во избежание непредвиденных ситуаций
            input.removeClass('disabled').attr('disabled',null);
        },10000);

        // Позже включим обратно нашу кнопочку и дадим возможность кликать на неё
        var enableInput = function () {
            input.removeClass('disabled').attr('disabled', null);
        };

        // Очистить от данных все инпуты в указанном контейнере
        var clearInputData = function (inputs_container) {
            this.getInputsList(inputs_container).map(function () {
                var $this = $(this);
                if ($this.attr('type') !== 'hidden') {
                    $this.val('');
                }
            });
        };

        // Проверим, что все элементы в массиве равны true
        var all_true = function (arr) {
            var success = true;
            arr.map(function (el) {
                if (el !== true) {
                    success = false;
                }
            });
            return success;
        };

        // Отошлем массив и обработаем ответ
        $.ajax({
            type: "POST",
            url: url,
            data: mass,
            dataType: 'json',
            success: function (data) {
                // Включим обратно кнопку отправки данных
                enableInput();

                // Если сервер ответил, попытаемся выполнить полученные от него команды
                data.map(function (command) {
                    try {
                        PrettyForms.Commands.execute(command.type, command.data);
                    } catch (e) {
                        console.log('error in handling message', e);
                    }
                });

                var need_clear_inputs = []; // Массив условий, при которых необходимо очистить элементы формы от данных
                need_clear_inputs.push(data[0].type !== 'validation_errors'); // Это не ответ о непройденной валидации отправленных данных
                //need_clear_inputs.push(typeof(data[0].data) !== 'string' || data[0].data.indexOf('Navigation.updateCoreInfo(true)') === -1); // Это не ошибка ключа безопасности
                need_clear_inputs.push(input_container_for_clear !== false); // Контейнер для инпутов был указан

                if (all_true(need_clear_inputs)) {
                    clearInputData(input_container_for_clear);
                }
            },
            error: function (data, status, e) {
                // Включим кнопку и отобразим сообщение об ошибке
                enableInput();
                PrettyForms.Commands.execute('validation_errors', [PrettyForms.messages.server_error]);
            }
        });
    };
};

$(document).ready(function () {
    // При наборе текста автоматически производить валидацию
    $('body').on('change keyup', 'input[data-validation], select[data-validation], textarea[data-validation]', function () {
        PrettyForms.Validator.validate($(this));
    });

    // При отправке формы автоматически производить валидацию данных в ней
    $('body').on('submit', 'form', function () {
        var form_values = PrettyForms.getInputData(this);
        if (form_values === false) {
            // Если во время сбора данных были обнаружены ошибки валидации, предотвратим отправку формы
            PrettyForms.validation_errors_container = $(this).find('.validation-errors');
            PrettyForms.Commands.execute('validation_errors');
            return false;
        } else {
            return true;
        }
    });

    // Перехватим клики на элементы с классом .senddata
    $('body').on('click', '.senddata', function () {
        var clicked_element = $(this);
        var link = clicked_element.attr('href');
        if (typeof (link) === 'undefined' || link === '#')
            link = clicked_element.attr('data-link');
        if (typeof (link) === 'undefined')
            link = document.location.href;

        var inputs_container = clicked_element.attr('data-input');
        // Проверим, что элемент, по которому был клик, не отключён через класс или атрибут
        if (!clicked_element.hasClass('disabled') && typeof (clicked_element.attr('disabled')) === 'undefined') {

            // Если есть класс really, сначала удостоверимся, что человек действительно хочет совершить действие
            if (clicked_element.hasClass('really')) {
                var text = PrettyForms.messages.really;
                if (clicked_element.attr('data-really-text')) {
                    text = clicked_element.attr('data-really-text');
                }

                if (!confirm(text)) {
                    return false;
                }
            }

            if (inputs_container) {
                PrettyForms.validation_errors_container = $(inputs_container + ' .validation-errors');
                if (PrettyForms.validation_errors_container.length === 0) {
                    // Если контейнер для ошибок валидации не был найден на странице, добавим его перед кнопкой
                    clicked_element.before(PrettyForms.templates.form_validation_messages);
                    PrettyForms.validation_errors_container = $(inputs_container + ' .validation-errors');
                }
                PrettyForms.validation_errors_container.html('').hide();

                // Снимем классы с инпутов, помеченных о том, что в них была найдена ошибка на сервере
                $(inputs_container).find('.validation-server-error').removeClass('validation-server-error');

                var form_values = PrettyForms.getInputData(inputs_container);
                if (form_values === false) {
                    PrettyForms.Commands.execute('validation_errors');
                } else {
                    var clearinputs = false;
                    // Если в атрибутах кнопки был передан атрибут "data-clearinputs" со значением "true", значит надо
                    // будет очистить форму после успешного запроса
                    if (clicked_element.attr('data-clearinputs') === 'true') {
                        clearinputs = inputs_container;
                    }
                    PrettyForms.sendData(link, form_values, clearinputs, clicked_element);
                }
            } else {
                // Если не был указан контейнер, из которого надо собрать информацию,
                // то просто отправим запрос на указанный URL и обработаем ответ.
                PrettyForms.sendData(link, {}, false, clicked_element);
            }
        }

        return false;
    });

    // Сервер, вместо ответа об успешном завершении операции,
    // может послать команду об отображении ошибок валидации. Отобразим их.
    PrettyForms.Commands.registerHandler('validation_errors', function (data) {
        if (PrettyForms.validation_errors_container.length > 0) {
            var html = PrettyForms.messages.fix_and_retry;
            if (typeof(data) !== 'undefined') {
                var focused = false;
                data.map(function (el) {
                    var element = $('[name="'+el.field+'"]');
                    if (element.length > 0) {
                        var element_errors = '';
                        el.errors.map(function(error){
                            var error_text = PrettyForms.templates.element_validation_message.replace('{%}', error);
                            element_errors += error_text;
                            html += error_text;
                        });
                        PrettyForms.Validator.markElementAsErroneous(element,element_errors,true);
                        if (focused === false) {
                            element.focus();
                            focused = true;
                        }
                    }
                });
            }
            PrettyForms.validation_errors_container.html(html).show();
        }
    });

    // Redirect to another page
    PrettyForms.Commands.registerHandler('redirect', function (link) {
        if (typeof(link) === 'undefined') {
            link = document.location.href;
        }
        document.location.href = link;
    });

    PrettyForms.Commands.registerHandler('nothing', function () {
        // nothing to do
    });

});