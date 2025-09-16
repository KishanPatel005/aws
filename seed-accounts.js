const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAccounts() {
  try {
    console.log('Seeding accounts...');

    // Create management accounts
    await prisma.account.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        type: 'management',
        name: 'Yogesh'
      }
    });

    await prisma.account.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        type: 'management',
        name: 'Dharmesh'
      }
    });

    // Create company account
    await prisma.account.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        type: 'company',
        name: 'bavadiya LLP'
      }
    });

    console.log('Accounts seeded successfully!');
  } catch (error) {
    console.error('Error seeding accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAccounts();
