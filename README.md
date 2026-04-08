# VPN Frontend

React + MUI приложение для управления VPN доступами.

## Быстрый старт

```bash
npm install
npm run dev
```

## Перед деплоем — поменяй API URL

Открой `src/api/index.ts` и замени:
```ts
export const API_BASE_URL = 'http://localhost:8000'
// на:
export const API_BASE_URL = 'http://ТВОЙـIP:8000'
```

## Сборка

```bash
npm run build
# dist/ — готовые статические файлы
```

## Docker

```bash
docker build -t vpn-frontend .
docker run -p 80:80 vpn-frontend
```

## Или добавить в существующий docker-compose:

```yaml
frontend:
  build: ./vpn-frontend
  container_name: frontend
  ports:
    - "80:80"
  depends_on:
    - backend
  networks:
    - shared-vpn-network
```

## Структура

```
src/
├── api/index.ts              # axios + все эндпоинты + типы
├── store/auth.ts             # Zustand: user, login, logout, init
├── theme/index.ts            # MUI dark theme
├── pages/LoginPage.tsx       # Логин + Регистрация
└── components/
    ├── App.tsx               # Роутинг + layout + bottom nav
    ├── client/ClientPage.tsx # Список VPN подключений юзера
    └── admin/
        ├── AdminPage.tsx     # Вкладки: активные / заявки
        ├── UserCard.tsx      # Карточка юзера + его подписки
        └── SubscribeDialog.tsx # Добавить/редактировать подписку
```

## Логика ролей

- **Обычный юзер** — видит только свои подключения, кнопка копировать payload
- **Суперюзер (admin)** — видит нижнюю навигацию с вкладкой «Пользователи»,  
  может активировать заявки, добавлять/редактировать/удалять подписки
