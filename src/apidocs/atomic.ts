// Write a file so a reader never sees half of it: temp file in the same directory, then rename over the target.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const renameAttempts = 5;
const renameRetryMs = 20;

/** Write to `<file>.tmp`, then rename over `file`. A rename that Windows refuses while a reader holds the target is retried briefly. */
export async function writeAtomic(file: string, text: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  for (let attempt = 1; ; attempt += 1) {
    try {
      await fs.rename(tmp, file);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= renameAttempts || (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES')) throw error;
      await new Promise((resolve) => setTimeout(resolve, renameRetryMs * attempt));
    }
  }
}
