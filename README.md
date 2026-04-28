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

**Frontend**
- Vue 3
- Flowbite
- Pinia

**Backend**
- Express
- Kysely
- Neon (PostgreSQL)
- tRPC
- Pino (logging)

**Testing**
- Vitest
- Supertest
- Playwright (E2E)

## Usage
The app is running [here](https://household-app.zsn6zwz8vsx1y.eu-west-3.cs.amazonlightsail.com/login)