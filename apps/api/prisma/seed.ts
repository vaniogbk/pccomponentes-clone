import argon2 from 'argon2';
import { PrismaClient, Univers } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { slug: 'cartes-graphiques', name: 'Cartes Graphiques', univers: Univers.CARTES_GRAPHIQUES, position: 1 },
  { slug: 'processeurs', name: 'Processeurs', univers: Univers.PROCESSEURS, position: 2 },
  { slug: 'consoles', name: 'Consoles', univers: Univers.CONSOLES, position: 3 },
  { slug: 'peripheriques-gaming', name: 'Périphériques Gaming', univers: Univers.PERIPHERIQUES_GAMING, position: 4 },
  { slug: 'stockage-memoire', name: 'Stockage & Mémoire', univers: Univers.STOCKAGE_MEMOIRE, position: 5 },
] as const;

async function seedCatalogCategories() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, isVisible: false },
      update: {
        name: category.name,
        univers: category.univers,
        position: category.position,
      },
    });
  }
}

async function seedUnconfiguredShipping() {
  const zone = await prisma.shippingZone.upsert({
    where: { name: 'France' },
    create: { name: 'France', isActive: false },
    update: { isActive: false },
  });

  await prisma.shippingCountry.upsert({
    where: { code: 'FR' },
    create: { code: 'FR', name: 'France', zoneId: zone.id, isEnabled: false },
    update: { name: 'France', zoneId: zone.id, isEnabled: false },
  });
}

async function seedInitialAdministrator() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email && !password) {
    return;
  }

  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 16) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD (16 caractères minimum) doivent être configurés ensemble.');
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      firstName: 'Administrateur',
      lastName: 'Boutique',
    },
    update: {},
  });
}

try {
  await seedCatalogCategories();
  await seedUnconfiguredShipping();
  await seedInitialAdministrator();
} finally {
  await prisma.$disconnect();
}
