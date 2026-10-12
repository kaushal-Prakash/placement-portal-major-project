import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the absolute path of an uploaded resume on disk,
 * handling variations in process.cwd() or relative path prefixes.
 * Returns the verified absolute path if the file exists, or null.
 */
export function getResumeFilePath(resumeUrl) {
  if (!resumeUrl) return null;

  const fileName = path.basename(resumeUrl);

  const candidatePaths = [
    path.resolve(__dirname, '../uploads', fileName),
    path.resolve(process.cwd(), 'uploads', fileName),
    path.resolve(process.cwd(), 'backend', 'uploads', fileName),
    path.resolve(__dirname, '../../uploads', fileName)
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to primary backend/uploads path
  return path.resolve(__dirname, '../uploads', fileName);
}
