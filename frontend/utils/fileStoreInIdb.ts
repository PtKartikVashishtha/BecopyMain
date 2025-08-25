// Type definition for stored file record
interface FileRecord {
  id: string;
  name: string;
  type: string;
  data: File | Blob;
  createdAt: number;
}

// Generate a unique ID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Open the IndexedDB and initialize store if needed
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MyFileDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a file to the "files" store
export async function saveFile(file: File): Promise<string> {
  const id = generateId();
  const db = await openDB();
  const tx = db.transaction("files", "readwrite");
  const store = tx.objectStore("files");

  const record: FileRecord = {
    id,
    name: file.name,
    type: file.type,
    data: file,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
  return id;
}

// Retrieve a file record by ID
export async function getFile(key: string): Promise<FileRecord | null> {
  try {
    const db = await openDB();
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");

    const record = await new Promise<FileRecord | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return record;
  } catch (error) {
    console.error("Failed to get file:", error);
    return null;
  }
}

// Delete a file from the "files" store by ID
export async function deleteFile(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction("files", "readwrite");
    const store = tx.objectStore("files");

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    return true;
  } catch (error) {
    console.error("Failed to delete file:", error);
    return false;
  }
}
