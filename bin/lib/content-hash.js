import crc32 from 'crc-32';

export const hashContent = (content) => {
  try {
    const hashedContent = crc32.str(content);
    return hashedContent.toString();
  } catch (error) {
    throw new Error('Error while hashing content');
  }
};

export const verifyContent = (content, hashedContent) => {
  try {
    const calculatedHash = crc32.str(content).toString();
    const isContentValid = (calculatedHash === hashedContent);
    return isContentValid;
  } catch (error) {
    throw new Error('Error while verifying content');
  }
};
