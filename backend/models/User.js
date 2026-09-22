import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  usn: { type: String, unique: true, sparse: true }, // Student USN
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  tenthMarks: { type: Number, default: null },
  twelfthMarks: { type: Number, default: null },
  activeBacklogs: { type: Number, default: 0 },
  historyOfBacklogs: { type: Number, default: 0 },
  currentCTC: { type: Number, default: 0 }, // For dream company policy
  cgpa: { type: Number, default: null }, // Only for students
  skills: [{ type: String }], // Extracted from resume
  resumeUrl: { type: String, default: null }, // Link to stored PDF
  isPlaced: { type: Boolean, default: false },
  placedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  isBlacklisted: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
