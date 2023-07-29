# Use the official Node.js image as a base
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container's working directory
COPY . .

# Expose the port on which your Node.js application listens
EXPOSE 3000

# Define the command to start your Node.js application
CMD ["npm", "start"]
