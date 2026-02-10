import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  adapter: {
    url: process.env.DATABASE_URL, // your connection string
  },
});

export {prisma}