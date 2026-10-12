import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Batch from './models/Batch.js';
import Branch from './models/Branch.js';
import User from './models/User.js';

dotenv.config();

// Box-Muller transform for realistic normal distributions
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

const FIRST_NAMES = [
  "Aarav", "Aditi", "Aditya", "Akash", "Ananya", "Aniket", "Ankita", "Arjun", "Bhavna", "Chetan",
  "Deepak", "Divya", "Gaurav", "Harsh", "Isha", "Ishaan", "Kavya", "Karan", "Kunal", "Lakshmi",
  "Manish", "Meera", "Manoj", "Neha", "Nikhil", "Nisha", "Pooja", "Pranav", "Prateek", "Priya",
  "Rahul", "Rakesh", "Rhea", "Rohan", "Rohit", "Rupesh", "Sachin", "Sameer", "Sanjay", "Sanjana",
  "Shreya", "Siddharth", "Sneha", "Sourav", "Sunil", "Suresh", "Tanvi", "Tarun", "Varun", "Vikas",
  "Vikram", "Vinay", "Vishal", "Yash", "Zoya", "Aishwarya", "Ashwin", "Bhargav", "Chirag", "Darshan"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Rao", "Nair", "Iyer", "Kulkarni", "Deshmukh", "Joshi", "Hegde",
  "Reddy", "Patil", "Shetty", "Bhat", "Kumar", "Gupta", "Singh", "Das", "Mishra", "Pandey",
  "Chauhan", "Menon", "Pillai", "Bose", "Ghosh", "Banerjee", "Sinha", "Saxena", "Agarwal", "Bhardwaj",
  "Mehta", "Shah", "Kapoor", "Malhotra", "Chopra", "Khanna", "Bhatia", "Sethi", "Trivedi", "Shukla",
  "Dubey", "Tiwari", "Yadav", "Gowda", "Naik", "Kamath", "Pai", "Prabhu", "Nadkarni", "Saldanha"
];

const SKILLS_POOLS = {
  CSE: [
    "JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "Java", "C++",
    "MongoDB", "PostgreSQL", "Docker", "AWS", "Git", "REST APIs", "TailwindCSS", "Next.js",
    "Data Structures", "Redis", "GraphQL", "Linux"
  ],
  ISE: [
    "Python", "Machine Learning", "Java", "SQL", "React", "Node.js", "Data Analytics",
    "Pandas", "NumPy", "Django", "FastAPI", "Cybersecurity", "Cloud Computing", "PowerBI",
    "Data Mining", "Git", "MongoDB", "TensorFlow"
  ],
  ECE: [
    "Embedded C", "C++", "Python", "Verilog", "MATLAB", "Microcontrollers", "VLSI Design",
    "IoT", "PCB Design", "Arduino", "ARM Cortex", "Digital Signal Processing", "FPGA",
    "RTOS", "Linux Device Drivers", "Circuit Simulation"
  ]
};

function getRandomSkills(branchCode) {
  const pool = SKILLS_POOLS[branchCode] || SKILLS_POOLS.CSE;
  const count = Math.floor(Math.random() * 4) + 3; // 3 to 6 skills
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_portal';
  console.log(`[Seed] Connecting to MongoDB at: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  // 1. Ensure Batches: 2026 and 2027
  console.log('[Seed] Setting up batches (2026, 2027)...');
  const batchYears = [2026, 2027];
  const batchMap = {};

  for (const year of batchYears) {
    let batch = await Batch.findOne({ year });
    if (!batch) {
      batch = await Batch.create({ year, isActive: true });
      console.log(`  + Created Batch ${year}`);
    } else {
      console.log(`  ✓ Found existing Batch ${year}`);
    }
    batchMap[year] = batch;
  }

  // 2. Ensure Branches: ISE, CSE, ECE
  console.log('[Seed] Setting up branches (ISE, CSE, ECE)...');
  const branchDefs = [
    { code: 'ISE', name: 'Information Science and Engineering', usnCode: 'IS', joinYearOffset: 4 },
    { code: 'CSE', name: 'Computer Science and Engineering', usnCode: 'CS', joinYearOffset: 4 },
    { code: 'ECE', name: 'Electronics and Communication Engineering', usnCode: 'EC', joinYearOffset: 4 }
  ];

  const branchMap = {};

  for (const bDef of branchDefs) {
    let branch = await Branch.findOne({ code: bDef.code });
    if (!branch) {
      branch = await Branch.create({ code: bDef.code, name: bDef.name });
      console.log(`  + Created Branch ${bDef.code} (${bDef.name})`);
    } else {
      console.log(`  ✓ Found existing Branch ${bDef.code}`);
    }
    branchMap[bDef.code] = { doc: branch, usnCode: bDef.usnCode };
  }

  // Pre-hash default password "student123" once for ultra-fast seeding
  console.log('[Seed] Pre-generating password hash for students (password: "student123")...');
  const defaultHashedPassword = await bcrypt.hash('student123', 10);

  // 3. Create 50 students in each branch for each year
  // (2 batches × 3 branches × 50 students = 300 students)
  console.log('[Seed] Generating 50 students per branch per year (300 total)...');
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const year of batchYears) {
    const admissionYearDigits = String(year - 4).slice(-2); // 2026 -> 22, 2027 -> 23

    for (const bDef of branchDefs) {
      const branchInfo = branchMap[bDef.code];
      const studentsForCohort = [];

      for (let i = 1; i <= 50; i++) {
        const rollStr = String(i).padStart(3, '0');
        const usn = `4NI${admissionYearDigits}${branchInfo.usnCode}${rollStr}`;

        const firstName = FIRST_NAMES[(i - 1 + (year % 10) * 5 + bDef.code.charCodeAt(0)) % FIRST_NAMES.length];
        const lastName = LAST_NAMES[(i - 1 + (year % 10) * 3 + bDef.code.charCodeAt(1)) % LAST_NAMES.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${usn.toLowerCase()}@college.edu`;

        // Normal distribution for academic metrics:
        // CGPA: mean 7.8, stdev 0.82, bounded [5.50, 9.95]
        const rawCgpa = gaussianRandom(7.85, 0.82);
        const cgpa = parseFloat(Math.min(9.95, Math.max(5.50, rawCgpa)).toFixed(2));

        // 10th Marks: mean 86.5%, stdev 6.8%, bounded [62, 99.5]
        const rawTenth = gaussianRandom(86.5, 6.8);
        const tenthMarks = parseFloat(Math.min(99.5, Math.max(62.0, rawTenth)).toFixed(1));

        // 12th Marks: mean 83.2%, stdev 7.5%, bounded [58, 98.5]
        const rawTwelfth = gaussianRandom(83.2, 7.5);
        const twelfthMarks = parseFloat(Math.min(98.5, Math.max(58.0, rawTwelfth)).toFixed(1));

        // Active backlogs with realistic probability distribution:
        // ~80% no backlogs, ~13% 1 backlog, ~5% 2 backlogs, ~2% 3 backlogs
        const randBacklog = Math.random();
        const activeBacklogs = randBacklog < 0.80 ? 0 : randBacklog < 0.93 ? 1 : randBacklog < 0.98 ? 2 : 3;
        const historyOfBacklogs = activeBacklogs + (Math.random() < 0.12 ? 1 : 0);

        const skills = getRandomSkills(bDef.code);

        studentsForCohort.push({
          name: fullName,
          email,
          password: defaultHashedPassword,
          role: 'student',
          usn,
          branch: branchInfo.doc._id,
          batch: batchMap[year]._id,
          tenthMarks,
          twelfthMarks,
          activeBacklogs,
          historyOfBacklogs,
          currentCTC: 0,
          cgpa,
          skills,
          isPlaced: false,
          placedJob: null,
          isBlacklisted: false
        });
      }

      // Upsert students by USN to avoid duplicate key errors
      for (const studentData of studentsForCohort) {
        const existing = await User.findOne({ usn: studentData.usn });
        if (!existing) {
          await User.create(studentData);
          totalCreated++;
        } else {
          await User.findByIdAndUpdate(existing._id, {
            ...studentData,
            password: existing.password // keep existing password if customized
          });
          totalUpdated++;
        }
      }

      console.log(`  ✓ Batch ${year} | ${bDef.code}: 50 students prepared (USNs: 4NI${admissionYearDigits}${branchInfo.usnCode}001 - 050)`);
    }
  }

  console.log('\n========================================');
  console.log(`🎉 DB Feeder Complete!`);
  console.log(`   - Batches: 2026, 2027`);
  console.log(`   - Branches: ISE, CSE, ECE`);
  console.log(`   - Students Created: ${totalCreated}`);
  console.log(`   - Students Updated: ${totalUpdated}`);
  console.log(`   - Total Active Students in Cohort: 300`);
  console.log(`   - Default Login Password: "student123"`);
  console.log('========================================\n');
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
