import fs from 'fs/promises';
import fsync from 'fs';
import path from 'path';

const shanoomrcPath = path.join(process.env.HOME, '.shanoomrc');

export const getToken = async () => {
  try {
    const fileContents = await fs.readFile(shanoomrcPath, 'utf-8');
    const { token } = JSON.parse(fileContents);
    return token;
  } catch (error) {
    console.error('Error reading .shanoomrc file:', error.message);
    process.exit(1);
  }
};


// Delete the .shanoomrc file
export const deleteTokenFile = () => {
    fsync.unlinkSync(shanoomrcPath);
};


// Empty the .shanoomrc file
export const deleteToken = () => {
    fsync.writeFileSync(shanoomrcPath, JSON.stringify({token: ''}));
};


// If the .shanoomrc file doesn't exist, create it
export const checkTokenFile = () => {
    if (!fsync.existsSync(shanoomrcPath)) {
        fsync.writeFileSync(shanoomrcPath, JSON.stringify({token: ''}));
    }
};
