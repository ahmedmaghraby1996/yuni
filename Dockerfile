FROM node:22

WORKDIR /usr/src/app

# Copy only package files first
COPY package*.json ./

# Install dependencies
RUN npm install --f

# Then copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
