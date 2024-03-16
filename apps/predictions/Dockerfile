FROM node:alpine as development

WORKDIR /usr/src/app

# Copy all necessary files to working dir
COPY package.json ./
COPY package-lock.json ./

COPY tsconfig.json ./
COPY nest-cli.json ./
COPY apps/predictions apps/predictions
COPY libs libs

# Install pnpm
RUN npm install -g pnpm

# Run npm install recursively 
RUN pnpm install -r

# Run the build command
RUN pnpm run build predictions


# Separate the stage to make the image leaner
FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV={NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install -g pnpm

# Install only the production dependencies
RUN pnpm install --production

# Copy the build dist from development stage
COPY --from=development /usr/src/app/dist ./dist

CMD [ "node", "dist/apps/predictions/main" ]

