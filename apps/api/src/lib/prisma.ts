import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

/** Client Prisma partagé, créé à la première requête qui en a besoin (la santé de l'API n'en dépend pas). */
export function getPrisma(): PrismaClient {
  client ??= new PrismaClient();
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
}
