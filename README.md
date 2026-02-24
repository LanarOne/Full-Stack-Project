# Household App
This app is designed to help a group or a single person to plan for meals.
It allows the users to gather themselves as Households and to share the state of the house storage, to build a shared recipe book and to keep track of the house stocks.

## Features
1. Manages the House storages, the user can input what is available in their fridges, dry storages or freezers, warning the user when an item is running low, automatically builds up a grocery list.
2. Allows the users to save their own recipes in order to suggest meals with what they actually have in stock, or what they could do adding a couple of ingredients.
3. Allows the users to plan their meals, sending invitations to the household and keeping track of who's coming to dinner. Also automatically updates the stocks should the users chose to cook something, or saving the name of their favourite restaurant if they chose to order in (based on user input).

## TechStack
**Language**
- TypeScript

**Runtime**
- Node.js

**Backend**
- Express
- Kysely
- PostgreSQL
- tRPC

**Testing**
- Vitest
- Supertest

## Scripts
- ```npm run build``` : Compiles the typescript files into javascript files, creating a "dist" folder for production
- ```npm run coverage``` : Runs the test coverage from Vitest
- ```npm run dev``` : Starts the development environment
- ```npm run format``` : Runs Prettier --write on the project to format the code according to the AirBnB config
- ```npm run gen:types``` : Runs the Kysely generation for database types (must be ran after creating the database)
- ```npm run lint``` : Checks quality and style of the code
- ```npm run migrate:latest``` : Runs the Kysely migrations (if any)
- ```npm run latest:prod``` : Runs the Kysely migrations (if any) for a production environment
- ```npm migrate:new``` : Creates a new migration file with correct timestamp
- ```npm run node-es``` : Runs Node with a custom loader to modify the TypeScript import at runtime
- ```npm run prod``` : Runs the migrations (if any) and runs production environment
- ```npm run start``` : Starts the production environment
- ```npm run start:again``` : Start the production environment without the custom loader
- ```npm run test``` : Runs the test suite
- ```npm run typecheck``` : Checks for TypeScript, does not write but returns typing errors

## Usage
Clone the repository somewhere on your computer.
There is a .env.example file at the root of the project, remove the ".example" from it and get the data you need, all fields are mandatory!

1. Create a PostgreSQL database
2. Fill up the .env file with the required data, run up the followings in your console
3. Run ```npm run migrate:latest``` to build up the database
4. Run ```npm install --legacy-peer-deps``` to install all the dependencies
5. Run ```npm run gen:types``` to create the database Types
6. Run ```npm run build``` to generate the dist folder with the js compiled files
7. Finally run ```npm run start``` to launch the server and start using the app