# Establece la imagen base de NodeJS con la versión adecuada
# FROM node:14-alpine
FROM node:18.15.0

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración y código fuente del proyecto
COPY package*.json ./
COPY yarn.lock ./
COPY . .

# Instala las dependencias del proyecto
RUN npm install --force

# Expone el puerto en el que se ejecuta la aplicación NestJS
# EXPOSE 3000
EXPOSE 8085

# Define las variables de entorno para la conexión a MongoDB
ENV MONGO_URI mongodb://localhost:27018/documental

# Inicia la aplicación NestJS
CMD ["yarn", "start:dev"]