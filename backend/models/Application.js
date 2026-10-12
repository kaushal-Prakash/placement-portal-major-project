import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  matchScore: { type: Number, default: null },
  status: { 
    type: String, 
    enum: ['applied', 'shortlisted', 'interviewing', 'placed', 'rejected'], 
    default: 'applied',
    lowercase: true
  },
  aiFeedback: { type: String, default: null } // Feedback from RAG/ONNX
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;
