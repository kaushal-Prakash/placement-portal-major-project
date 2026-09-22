import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  minCgpa: { type: Number, required: true },
  maxBacklogs: { type: Number, default: 0 },
  allowedBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  allowedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  ctc: { type: Number, required: true }, // CTC in LPA
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;
