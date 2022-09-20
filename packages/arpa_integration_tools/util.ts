import * as path from "path";
import * as fs from "fs/promises";

export function truncateExtension(filePath: string): string {
  const { dir, name } = path.parse(filePath);
  return path.join(dir, name);
}

export function exists(fpath: string): Promise<boolean> {
  return fs.access(fpath).then(
    () => true,
    () => false
  );
}
