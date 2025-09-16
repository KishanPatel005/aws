import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await Promise.all([
    // 1 System Admin
    prisma.user.create({
      data: {
        user_type: 'SYSTEM_ADMIN',
        name: 'System Administrator',
        email: 'admin@crm.com',
        phone: '9876543210',
        password: 'admin123',
        salary: 100000
      }
    }),

    // 2 Management
    prisma.user.create({
      data: {
        user_type: 'MANAGEMENT',
        name: 'John Smith',
        email: 'john.smith@crm.com',
        phone: '9876543211',
        password: 'password123',
        salary: 80000
      }
    }),
    prisma.user.create({
      data: {
        user_type: 'MANAGEMENT',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@crm.com',
        phone: '9876543212',
        password: 'password123',
        salary: 75000
      }
    }),

    // 2 Manager
    prisma.user.create({
      data: {
        user_type: 'MANAGER',
        name: 'Mike Wilson',
        email: 'mike.wilson@crm.com',
        phone: '9876543213',
        password: 'password123',
        salary: 60000
      }
    }),
    prisma.user.create({
      data: {
        user_type: 'MANAGER',
        name: 'Lisa Brown',
        email: 'lisa.brown@crm.com',
        phone: '9876543214',
        password: 'password123',
        salary: 55000
      }
    }),

    // 1 Employee
    prisma.user.create({
      data: {
        user_type: 'EMPLOYEE',
        name: 'David Lee',
        email: 'david.lee@crm.com',
        phone: '9876543215',
        password: 'password123',
        salary: 40000
      }
    })
  ]);

  console.log('✅ Created users:', users.length);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.user_type}) - ${user.email} - ₹${user.salary}`);
  });

  // Create some sample expenses
  const expenses = await Promise.all([
    // Salary expenses for January 2024
    prisma.expense.create({
      data: {
        type: 'SALARY',
        accountFrom: 'Company',
        toUserId: users[1].id, // John Smith (Management)
        month: 'January 2024',
        amount: 80000,
        remarks: 'Monthly salary payment'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'SALARY',
        accountFrom: 'Company',
        toUserId: users[2].id, // Sarah Johnson (Management)
        month: 'January 2024',
        amount: 75000,
        remarks: 'Monthly salary payment'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'SALARY',
        accountFrom: 'Company',
        toUserId: users[3].id, // Mike Wilson (Manager)
        month: 'January 2024',
        amount: 60000,
        remarks: 'Monthly salary payment'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'SALARY',
        accountFrom: 'Company',
        toUserId: users[4].id, // Lisa Brown (Manager)
        month: 'January 2024',
        amount: 55000,
        remarks: 'Monthly salary payment'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'SALARY',
        accountFrom: 'Company',
        toUserId: users[5].id, // David Lee (Employee)
        month: 'January 2024',
        amount: 40000,
        remarks: 'Monthly salary payment'
      }
    }),

    // Office expenses
    prisma.expense.create({
      data: {
        type: 'OFFICE',
        accountFrom: 'John Smith',
        toUserId: null,
        month: null,
        amount: 5000,
        remarks: 'Office supplies and equipment'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'OFFICE',
        accountFrom: 'Company',
        toUserId: null,
        month: null,
        amount: 12000,
        remarks: 'Rent and utilities'
      }
    }),

    // Advertisement expenses
    prisma.expense.create({
      data: {
        type: 'ADVERTISEMENT',
        accountFrom: 'Company',
        toUserId: null,
        month: null,
        amount: 15000,
        remarks: 'Online marketing campaign'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'ADVERTISEMENT',
        accountFrom: 'Company',
        toUserId: null,
        month: null,
        amount: 8000,
        remarks: 'Print media advertising'
      }
    }),

    // Advance payments
    prisma.expense.create({
      data: {
        type: 'ADVANCE',
        accountFrom: 'Sarah Johnson',
        toUserId: users[5].id, // David Lee (Employee)
        month: null,
        amount: 10000,
        remarks: 'Advance payment for project work'
      }
    }),
    prisma.expense.create({
      data: {
        type: 'ADVANCE',
        accountFrom: 'Mike Wilson',
        toUserId: users[5].id, // David Lee (Employee)
        month: null,
        amount: 5000,
        remarks: 'Travel advance'
      }
    }),

    // Withdrawal
    prisma.expense.create({
      data: {
        type: 'WITHDRAWAL',
        accountFrom: 'Company',
        toUserId: users[0].id, // System Administrator
        month: null,
        amount: 25000,
        remarks: 'Business withdrawal for investment'
      }
    })
  ]);

  console.log('✅ Created expenses:', expenses.length);
  expenses.forEach(expense => {
    const toUser = expense.toUserId ? users.find(u => u.id === expense.toUserId)?.name : 'N/A';
    console.log(`  - ${expense.type} - ₹${expense.amount} - From: ${expense.accountFrom} - To: ${toUser}`);
  });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
