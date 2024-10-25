import fs from 'fs';
import path from 'path';
import { copyFile } from 'copy-file';

export const copyOriginalFile = async (originalSrc, finalDest) => {
  try {
    await copyFile(originalSrc, finalDest);
    console.log('file copied');
  } catch (err) {
    console.log(err);
  }
};

export const emptyDir = async (dirPath) => {
  try {
    // list dir content
    const dirContents = fs.readdirSync(dirPath);

    for (const fileOrDirPath of dirContents) {
      try {
        // get full path
        const fullPath = path.join(dirPath, fileOrDirPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // it's a sub directory
          if (fs.readdirSync(fullPath).length) emptyDir(fullPath);

          // if the dir is not empty then remove it's contents too(recursively)
          fs.rmdirSync(fullPath);

        } else {
          // it's a file
          fs.unlinkSync(fullPath);
        }

      } catch (ex) {
        console.error(ex.message);
      }
    }
  } catch (err) {
    console.log(err);
  }
};