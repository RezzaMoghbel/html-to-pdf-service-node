/**
 * File System Utilities
 *
 * Provides atomic file operations for the JSON-based database.
 * All operations are designed to be safe for concurrent access and
 * maintain data integrity through atomic writes.
 *
 * @fileoverview File system operations for user data storage
 * @author PDF Service Team
 * @version 1.0.0
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

/**
 * Read and parse a JSON file
 *
 * @param {string} filepath - Path to the JSON file
 * @returns {Promise<Object>} Parsed JSON object
 * @throws {Error} If file doesn't exist or contains invalid JSON
 *
 * @example
 * const userData = await readJSONFile('database/users/user123.json');
 * console.log(userData.email);
 */
async function readJSONFile(filepath) {
  try {
    const data = await fs.readFile(filepath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filepath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${filepath}`);
    } else {
      throw new Error(`Failed to read file ${filepath}: ${error.message}`);
    }
  }
}

/**
 * Write JSON data to a file atomically
 *
 * Uses atomic write pattern: write to temp file, then rename.
 * This ensures data integrity even if the process is interrupted.
 *
 * @param {string} filepath - Path to the JSON file
 * @param {Object} data - Data object to write
 * @returns {Promise<void>}
 * @throws {Error} If write operation fails
 *
 * @example
 * await writeJSONFile('database/users/user123.json', userData);
 */
async function writeJSONFile(filepath, data) {
  try {
    // Ensure directory exists
    await ensureDirectory(path.dirname(filepath));

    // Create temporary file path
    const tempFilepath = `${filepath}.tmp.${crypto
      .randomBytes(8)
      .toString("hex")}`;

    // Write to temporary file first
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(tempFilepath, jsonString, "utf8");

    // Atomic rename (this is atomic on most filesystems)
    await fs.rename(tempFilepath, filepath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(
        `${filepath}.tmp.${crypto.randomBytes(8).toString("hex")}`
      );
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to write file ${filepath}: ${error.message}`);
  }
}

/**
 * Check if a file exists
 *
 * @param {string} filepath - Path to the file
 * @returns {Promise<boolean>} True if file exists, false otherwise
 *
 * @example
 * const exists = await fileExists('database/users/user123.json');
 * if (exists) {
 *   console.log('User file exists');
 * }
 */
async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete a file safely
 *
 * @param {string} filepath - Path to the file to delete
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 *
 * @example
 * await deleteFile('database/users/user123.json');
 */
async function deleteFile(filepath) {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error(`Failed to delete file ${filepath}: ${error.message}`);
    }
    // File doesn't exist, which is fine for deletion
  }
}

/**
 * List all files in a directory
 *
 * @param {string} directory - Path to the directory
 * @param {string} [extension] - Optional file extension filter (e.g., '.json')
 * @returns {Promise<string[]>} Array of file paths
 * @throws {Error} If directory doesn't exist or can't be read
 *
 * @example
 * const userFiles = await listFiles('database/users', '.json');
 * console.log(`Found ${userFiles.length} user files`);
 */
async function listFiles(directory, extension = null) {
  try {
    const files = await fs.readdir(directory);

    if (extension) {
      return files
        .filter((file) => file.endsWith(extension))
        .map((file) => path.join(directory, file));
    }

    return files.map((file) => path.join(directory, file));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Directory not found: ${directory}`);
    } else {
      throw new Error(`Failed to list files in ${directory}: ${error.message}`);
    }
  }
}

/**
 * Ensure a directory exists, create it if it doesn't
 *
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 * @throws {Error} If directory creation fails
 *
 * @example
 * await ensureDirectory('database/users');
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw new Error(
        `Failed to create directory ${dirPath}: ${error.message}`
      );
    }
  }
}

/**
 * Get file statistics
 *
 * @param {string} filepath - Path to the file
 * @returns {Promise<Object>} File stats object
 * @throws {Error} If file doesn't exist or can't be accessed
 *
 * @example
 * const stats = await getFileStats('database/users/user123.json');
 * console.log(`File size: ${stats.size} bytes`);
 * console.log(`Last modified: ${stats.mtime}`);
 */
async function getFileStats(filepath) {
  try {
    return await fs.stat(filepath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filepath}`);
    } else {
      throw new Error(
        `Failed to get file stats for ${filepath}: ${error.message}`
      );
    }
  }
}

/**
 * Copy a file to a new location
 *
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 * @throws {Error} If copy operation fails
 *
 * @example
 * await copyFile('database/users/user123.json', 'backup/user123.json');
 */
async function copyFile(sourcePath, destPath) {
  try {
    await ensureDirectory(path.dirname(destPath));
    await fs.copyFile(sourcePath, destPath);
  } catch (error) {
    throw new Error(
      `Failed to copy file from ${sourcePath} to ${destPath}: ${error.message}`
    );
  }
}

/**
 * Move a file to a new location
 *
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {Promise<void>}
 * @throws {Error} If move operation fails
 *
 * @example
 * await moveFile('database/users/user123.json', 'database/users/archived/user123.json');
 */
async function moveFile(sourcePath, destPath) {
  try {
    await ensureDirectory(path.dirname(destPath));
    await fs.rename(sourcePath, destPath);
  } catch (error) {
    throw new Error(
      `Failed to move file from ${sourcePath} to ${destPath}: ${error.message}`
    );
  }
}

/**
 * Create a backup of a file
 *
 * @param {string} filepath - Path to the file to backup
 * @param {string} [backupDir] - Backup directory (defaults to same directory)
 * @returns {Promise<string>} Path to the backup file
 * @throws {Error} If backup operation fails
 *
 * @example
 * const backupPath = await createBackup('database/users/user123.json');
 * console.log(`Backup created at: ${backupPath}`);
 */
async function createBackup(filepath, backupDir = null) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = path.basename(filepath);
    const nameWithoutExt = path.parse(filename).name;
    const ext = path.parse(filename).ext;

    const backupFilename = `${nameWithoutExt}.backup.${timestamp}${ext}`;
    const backupPath = backupDir
      ? path.join(backupDir, backupFilename)
      : path.join(path.dirname(filepath), backupFilename);

    await copyFile(filepath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup of ${filepath}: ${error.message}`);
  }
}

/**
 * Validate JSON file integrity
 *
 * @param {string} filepath - Path to the JSON file
 * @returns {Promise<boolean>} True if JSON is valid, false otherwise
 *
 * @example
 * const isValid = await validateJSONFile('database/users/user123.json');
 * if (!isValid) {
 *   console.log('JSON file is corrupted');
 * }
 */
async function validateJSONFile(filepath) {
  try {
    await readJSONFile(filepath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get directory size in bytes
 *
 * @param {string} directory - Path to the directory
 * @returns {Promise<number>} Total size in bytes
 * @throws {Error} If directory can't be accessed
 *
 * @example
 * const size = await getDirectorySize('database/users');
 * console.log(`Users directory size: ${size} bytes`);
 */
async function getDirectorySize(directory) {
  try {
    const files = await listFiles(directory);
    let totalSize = 0;

    for (const file of files) {
      const stats = await getFileStats(file);
      totalSize += stats.size;
    }

    return totalSize;
  } catch (error) {
    throw new Error(
      `Failed to get directory size for ${directory}: ${error.message}`
    );
  }
}

/**
 * Clean up old temporary files
 *
 * @param {string} directory - Directory to clean up
 * @param {number} [maxAge] - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<number>} Number of files cleaned up
 *
 * @example
 * const cleaned = await cleanupTempFiles('database/users', 3600000);
 * console.log(`Cleaned up ${cleaned} temporary files`);
 */
async function cleanupTempFiles(directory, maxAge = 3600000) {
  try {
    const files = await listFiles(directory);
    const now = Date.now();
    let cleanedCount = 0;

    for (const file of files) {
      if (file.includes(".tmp.") || file.includes(".backup.")) {
        const stats = await getFileStats(file);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          await deleteFile(file);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  } catch (error) {
    throw new Error(
      `Failed to cleanup temp files in ${directory}: ${error.message}`
    );
  }
}

module.exports = {
  readJSONFile,
  writeJSONFile,
  fileExists,
  deleteFile,
  listFiles,
  ensureDirectory,
  getFileStats,
  copyFile,
  moveFile,
  createBackup,
  validateJSONFile,
  getDirectorySize,
  cleanupTempFiles,
};
