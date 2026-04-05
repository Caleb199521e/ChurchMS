const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Branch = require('./models/Branch');
const Department = require('./models/Department');
const Member = require('./models/Member');
const Visitor = require('./models/Visitor');
const Announcement = require('./models/Announcement');
const AuditLog = require('./models/AuditLog');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  // Clear existing data
  await User.deleteMany();
  await Branch.deleteMany();
  await Department.deleteMany();
  await Member.deleteMany();
  await Visitor.deleteMany();
  await Announcement.deleteMany();
  await AuditLog.deleteMany();

  // Create super-admin user first (needs to exist for Branch.createdBy)
  const superAdmin = await User.create({
    name: 'Super Administrator',
    email: 'superadmin@church.com',
    password: 'superadmin123',
    role: 'super-admin',
    branchId: null  // Super-admin isn't tied to specific branch initially
  });

  // NOW create Main Branch with super-admin as creator
  let mainBranch = await Branch.create({
    name: 'Main Branch',
    email: 'main@church.com',
    phone: '0541234567',
    address: 'Accra, Ghana',
    createdBy: superAdmin._id  // Set super-admin as creator
  });

  console.log('Created main branch');

  // Create branch manager
  const branchManager = await User.create({
    name: 'Branch Manager',
    email: 'manager@church.com',
    password: 'manager123',
    role: 'branch-manager',
    branchId: mainBranch._id
  });

  // Update main branch manager
  mainBranch.manager = branchManager._id;
  mainBranch.createdBy = superAdmin._id;
  await mainBranch.save();

  // Create staff user
  await User.create({
    name: 'Church Staff',
    email: 'staff@church.com',
    password: 'staff123',
    role: 'staff',
    branchId: mainBranch._id
  });

  console.log('Created users:');
  console.log('  Super Admin → superadmin@church.com / superadmin123');
  console.log('  Branch Manager → manager@church.com / manager123');
  console.log('  Staff → staff@church.com / staff123');

  // Create departments for main branch
  const departments = await Department.insertMany([
    { name: 'Choir', description: 'Music and worship team', branchId: mainBranch._id },
    { name: 'Ushers', description: 'Welcome and hospitality', branchId: mainBranch._id },
    { name: 'Youth', description: 'Youth ministry', branchId: mainBranch._id },
    { name: 'Welfare', description: 'Member welfare and support', branchId: mainBranch._id },
    { name: 'Prayer', description: 'Intercessory prayer team', branchId: mainBranch._id },
    { name: 'Media', description: 'Audio/Visual and recording', branchId: mainBranch._id },
    { name: 'Evangelism', description: 'Outreach and evangelism', branchId: mainBranch._id },
  ]);

  console.log(`Created ${departments.length} departments for main branch`);

  // Sample members for main branch
  const memberData = [
    { fullName: 'Kwame Asante', phone: '0244123456', gender: 'male', department: departments[0]._id, role: 'leader', branchId: mainBranch._id },
    { fullName: 'Abena Mensah', phone: '0201234567', gender: 'female', department: departments[1]._id, branchId: mainBranch._id },
    { fullName: 'Kofi Boateng', phone: '0271234567', gender: 'male', department: departments[2]._id, branchId: mainBranch._id },
    { fullName: 'Akosua Darko', phone: '0551234567', gender: 'female', department: departments[0]._id, branchId: mainBranch._id },
    { fullName: 'Yaw Owusu', phone: '0241234567', gender: 'male', department: departments[4]._id, role: 'elder', branchId: mainBranch._id },
    { fullName: 'Ama Bonsu', phone: '0241234568', gender: 'female', department: departments[3]._id, branchId: mainBranch._id },
    { fullName: 'Kweku Frimpong', phone: '0241234569', gender: 'male', department: departments[6]._id, branchId: mainBranch._id },
    { fullName: 'Efua Amponsah', phone: '0241234570', gender: 'female', department: departments[1]._id, branchId: mainBranch._id },
  ];

  const members = await Member.insertMany(memberData);
  console.log(`Created ${members.length} sample members for main branch`);

  // Sample visitors for main branch
  const visitors = await Visitor.insertMany([
    { name: 'John Mensah', phone: '0571234567', email: 'john@example.com', invitedBy: 'Kwame Asante', branchId: mainBranch._id },
    { name: 'Grace Osei', phone: '0581234567', email: 'grace@example.com', invitedBy: 'Abena Mensah', branchId: mainBranch._id },
  ]);

  console.log(`Created ${visitors.length} sample visitors for main branch`);

  // Sample announcements for main branch
  await Announcement.insertMany([
    {
      title: 'Welcome to Our Church CMS',
      message: 'This system helps us manage our church family better. Contact superadmin for any help.',
      priority: 'normal',
      createdBy: superAdmin._id,
      branchId: mainBranch._id
    },
    {
      title: 'Sunday Service',
      message: 'Sunday service holds every week at 9:00 AM. All members are encouraged to be punctual.',
      priority: 'normal',
      createdBy: superAdmin._id,
      branchId: mainBranch._id
    }
  ]);

  console.log('Created sample announcements for main branch');
  console.log('\n✅ Seed complete! You can now start the server.');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
