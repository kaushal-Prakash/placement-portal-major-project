import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
