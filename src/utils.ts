import * as path from "path";
import * as fs from "fs";

function getParentFolder(folder: string): string {
  return path.resolve(folder, "..");
}

export function findFileUpward(name: string, startDir: string) {
  let directory = startDir;

  while (true) {
    const fullPath = path.join(directory, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    // If we reach root, quit
    if (directory === path.sep) {
      return null;
    }

    directory = getParentFolder(directory);
  }
}
