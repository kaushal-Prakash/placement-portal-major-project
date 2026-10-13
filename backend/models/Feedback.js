import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String }, // Senior/Alumni name if external or historical
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  linkedinUrl: { type: String, required: true }, // Mandatory LinkedIn URL
  phone: { type: String }, // Optional Phone
  email: { type: String }, // Optional Email
  interviewQuestions: [{ type: String }],
  rounds: [{
    roundNumber: { type: Number },
    roundName: { type: String },
    details: { type: String },
    questions: [{ type: String }]
  }],
  advice: { type: String },
  rating: { type: Number, min: 1, max: 5, default: 3 },
  batch: { type: String },
  ctc: { type: Number },
  verifiedAlumni: { type: Boolean, default: true }
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
