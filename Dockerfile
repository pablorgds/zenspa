# =========================
# STAGE 1: Ambiente de DEV
# =========================
FROM node:20-alpine AS dev

WORKDIR /app

# Copia package.json / package-lock.json (se tiver)
COPY package*.json ./

RUN npm install

# Copia o restante do código
COPY . .

EXPOSE 5173

# Comando padrão no modo dev (Vite)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]


# =========================
# STAGE 2: BUILD (produção)
# =========================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gera os arquivos estáticos do Vite (pasta dist/)
RUN npm run build


# =========================
# STAGE 3: PROD (Nginx)
# =========================
FROM nginx:1.27-alpine AS prod

# Remove configuração default
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build gerado no stage anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
