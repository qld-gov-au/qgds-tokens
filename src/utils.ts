import path from "path";

export function getParentFolderFromFilePath(filePath: string): string {
  return path.dirname(filePath).split(path.sep).pop() || "";
}
