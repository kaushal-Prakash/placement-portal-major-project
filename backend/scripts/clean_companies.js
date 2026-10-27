import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/placement_portal';

async function cleanCompanies() {
  console.log(`Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;
  const companiesColl = db.collection('companies');
  const jobsColl = db.collection('jobs');
  const appsColl = db.collection('applications');
  const feedbacksColl = db.collection('feedbacks');

  const allCompanies = await companiesColl.find({}).sort({ _id: 1 }).toArray();
  console.log(`Total companies currently found: ${allCompanies.length}`);

  if (allCompanies.length <= 4) {
    console.log('4 or fewer companies exist. Nothing to prune.');
    process.exit(0);
  }

  const keepCompanies = allCompanies.slice(0, 4);
  const keepCompanyIds = keepCompanies.map(c => c._id);
  const keepCompanyNames = keepCompanies.map(c => c.name);

  console.log('Keeping the first 4 companies:');
  keepCompanies.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.name} (ID: ${c._id})`);
  });

  const removeCompanyIds = allCompanies.slice(4).map(c => c._id);

  // 1. Delete jobs that belong to companies being removed
  const deletedJobsResult = await jobsColl.deleteMany({ company: { $in: removeCompanyIds } });
  console.log(`Deleted ${deletedJobsResult.deletedCount} associated jobs.`);

  // 2. Delete companies
  const deletedCompaniesResult = await companiesColl.deleteMany({ _id: { $in: removeCompanyIds } });
  console.log(`Deleted ${deletedCompaniesResult.deletedCount} companies.`);

  // 3. Keep remaining jobs IDs
  const remainingJobs = await jobsColl.find({}).toArray();
  const remainingJobIds = remainingJobs.map(j => j._id);

  // Clean applications pointing to removed jobs
  const deletedAppsResult = await appsColl.deleteMany({ job: { $nin: remainingJobIds } });
  console.log(`Deleted ${deletedAppsResult.deletedCount} orphaned applications.`);

  // Clean feedback for companies not in kept names
  const deletedFeedbacks = await feedbacksColl.deleteMany({ company: { $nin: keepCompanyNames } });
  console.log(`Deleted ${deletedFeedbacks.deletedCount} orphaned feedbacks for removed companies.`);

  console.log('\nRemaining companies count:', await companiesColl.countDocuments());
  console.log('Remaining jobs count:', await jobsColl.countDocuments());

  await mongoose.disconnect();
  console.log('Finished company cleanup successfully!');
}

cleanCompanies().catch(err => {
  console.error('Error cleaning companies:', err);
  process.exit(1);
});
