const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  try {
    console.log('Starting password hashing...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to update`);
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`User ${user.email} already has hashed password, skipping...`);
        continue;
      }
      
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      // Update the user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`Updated password for user: ${user.email}`);
    }
    
    console.log('Password hashing completed successfully!');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

hashExistingPasswords();
