1. Установите https://www.postgresql.org/download/
2. Создайте Базу данных
3. Cоздайте таблицу пользователей

CREATE TABLE public.users
(
    id text,
    password text,
    idtype text
);

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;

4. Создайте таблицу для хранения токенов
CREATE TABLE public.tokens
(
    id text,
    accesstoken text,
    refreshtoken text,
    accesstokendate timestamp with time zone
);

ALTER TABLE IF EXISTS public.tokens
    OWNER to postgres;

5. Установите nodeJS - https://nodejs.org/en/ (у меня на момент написания кода 16.17.0)

Заметка: если у вас уже используется nodeJS, и Вы не хотите 'загрязнять' глобальные пакеты или у Вас могут возникнуть проблемы с совместимостью глобальных пакетов. Можно использовать утилиту nvm - Node Version Manager. Она позволяет управлять разными версиями nodeJS на одной машине. Установщик для Windows - https://github.com/coreybutler/nvm-windows/releases Установка в Unix cистемах - $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash $ wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash

    В консоли - nvm list available - список доступных для установки версий Node.js,
                nvm install 16.17.0 - установить nodeJS выбранной версиями
                nvm list - список установленных версий nodeJS
                nvm use (версия) - переключить версию nodeJS

6. Перейдите с проектом и выполните npm install - это установит зависимости проекта.

7. Создайте файл .env - заполните поля (в приложении созданы значения по умолчанию)
DB_USER 
DB_HOST - хост БД
DB_DATABASE - название созданной Вами базы данных
DB_PASSWORD - пароль для подключения к бд
DB_PORT - порт
PORT - порт приложения
ACCESS_TOKEN_PRIVATE_KEY - ключ для формирования Bearer токена
REFRESH_TOKEN_PRIVATE_KEY - ключ для формирования refresh токена
ACCESS_TOKEN_PRIVATE_KEY - время действия Bearer токена

8. Запустить проект - npm start