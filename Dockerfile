# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_ADMIN_PASSWORD
ENV VITE_SUPABASE_URL=https://qsuyepdbtblxvajxqqea.supabase.co
ENV VITE_SUPABASE_ANON_KEY=sb_publishable_HHuHqRvzzM3pGHC1fvMyNw_QYOWIQn8
ENV VITE_ADMIN_PASSWORD=$VITE_ADMIN_PASSWORD
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
