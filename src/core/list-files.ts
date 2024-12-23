import fs from "fs";
import path from "path";

/**
 * 1行目にディレクトリ名、2行目以降にファイルIDが記載されたファイルリストファイルを読み込み、
 * ファイルの絶対パスのリストを返す
 * @param fileListFile
 * @returns
 */
export const listFiles = (fileListFile: string): string[] => {
  const lines = fs
    .readFileSync(fileListFile, "utf-8")
    .split("\n")
    .map((l) => l.trim());
  const [dirName, ...tail] = lines;
  const allFiles = fs.readdirSync(dirName);

  return tail.flatMap((fileId) => {
    const file = allFiles.find((f) => f.startsWith(fileId));
    if (file) {
      return [path.join(dirName, file)];
    } else {
      return [];
    }
  });
};
