const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Department = require('./models/Department');
const Member = require('./models/Member');
const Announcement = require('./models/Announcement');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  // Clear existing data
  await User.deleteMany();
  await Department.deleteMany();
  await Announcement.deleteMany();

  // Create departments
  const departments = await Department.insertMany([
    { name: 'Choir', description: 'Music and worship team' },
    { name: 'Ushers', description: 'Welcome and hospitality' },
    { name: 'Youth', description: 'Youth ministry' },
    { name: 'Welfare', description: 'Member welfare and support' },
    { name: 'Prayer', description: 'Intercessory prayer team' },
    { name: 'Media', description: 'Audio/Visual and recording' },
    { name: 'Evangelism', description: 'Outreach and evangelism' },
  ]);

  console.log(`Created ${departments.length} departments`);

  // Create admin user
  const admin = await User.create({
    name: 'Church Admin',
    email: 'admin@church.com',
    password: 'admin123',
    role: 'admin'
  });

  // Create staff user
  await User.create({
    name: 'Church Staff',
    email: 'staff@church.com',
    password: 'staff123',
    role: 'staff'
  });

  console.log('Created users:');
  console.log('  Admin → admin@church.com / admin123');
  console.log('  Staff → staff@church.com / staff123');

  // Sample members
  const memberData = [
    { fullName: 'Kwame Asante', phone: '0244123456', gender: 'male', department: departments[0]._id, role: 'leader' },
    { fullName: 'Abena Mensah', phone: '0201234567', gender: 'female', department: departments[1]._id },
    { fullName: 'Kofi Boateng', phone: '0271234567', gender: 'male', department: departments[2]._id },
    { fullName: 'Akosua Darko', phone: '0551234567', gender: 'female', department: departments[0]._id },
    { fullName: 'Yaw Owusu', phone: '0241234567', gender: 'male', department: departments[4]._id, role: 'elder' },
    { fullName: 'Ama Bonsu', phone: '0241234568', gender: 'female', department: departments[3]._id },
    { fullName: 'Kweku Frimpong', phone: '0241234569', gender: 'male', department: departments[6]._id },
    { fullName: 'Efua Amponsah', phone: '0241234570', gender: 'female', department: departments[1]._id },
  ];

  const members = await Member.insertMany(memberData);
  console.log(`Created ${members.length} sample members`);

  // Sample announcements
  await Announcement.insertMany([
    {
      title: 'Welcome to Our Church CMS',
      message: 'This system helps us manage our church family better. Contact admin for any help.',
      priority: 'normal',
      createdBy: admin._id
    },
    {
      title: 'Sunday Service',
      message: 'Sunday service holds every week at 9:00 AM. All members are encouraged to be punctual.',
      priority: 'normal',
      createdBy: admin._id
    }
  ]);

  console.log('Created sample announcements');
  console.log('\n✅ Seed complete! You can now start the server.');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
