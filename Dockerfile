# ---------- BUILD ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# ---------- RUN ----------
FROM node:20-alpine
WORKDIR /app

# Устанавливаем сервер для статики
RUN npm install -g serve

# Копируем билд
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]