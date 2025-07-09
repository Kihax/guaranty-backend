FROM node:20

# Définir le dossier de travail
WORKDIR /home/node/app

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tous les autres fichiers (code, config, etc.)
COPY . .

# Exposer le port par défaut d'AdonisJS
EXPOSE 3333

# Lancer le serveur Adonis en mode développement
CMD ["node", "ace", "serve", "--watch"]