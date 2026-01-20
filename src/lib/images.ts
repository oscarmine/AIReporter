// Image storage - metadata in localStorage, actual files on disk via IPC

const IMAGES_META_KEY = 'ai-reporter-images-meta';

export interface StoredImage {
    id: string;
    reportId: string;
    description: string;
    filePath: string; // Path to actual file on disk
    createdAt: number;
}

function generateImageId(): string {
    return 'img-' + Math.random().toString(36).substr(2, 6);
}

// Sanitize description to only allow letters, numbers, spaces, and basic punctuation
export function sanitizeDescription(desc: string): string {
    // Allow letters (including unicode), numbers, spaces, and basic punctuation
    return desc
        .replace(/[^\p{L}\p{N}\s.,!?()-]/gu, '') // Remove non-allowed chars
        .replace(/\s+/g, ' ')                     // Collapse multiple spaces
        .trim()
        .slice(0, 100);                           // Max 100 chars
}

// Get all image metadata
function getAllImagesMeta(): StoredImage[] {
    try {
        const data = localStorage.getItem(IMAGES_META_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Save image metadata
function saveAllImagesMeta(images: StoredImage[]): void {
    try {
        localStorage.setItem(IMAGES_META_KEY, JSON.stringify(images));
    } catch (e) {
        console.error('Failed to save image metadata:', e);
    }
}

// Store a new image - saves file to disk via IPC
export async function storeImage(reportId: string, file: File, description: string): Promise<StoredImage> {
    const imageId = generateImageId();

    // Sanitize description
    const sanitizedDesc = sanitizeDescription(description) || 'Screenshot';

    // Read file as base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });

    // Save to disk via IPC
    const filePath = await window.ipcRenderer.invoke('save-image', imageId, base64Data);

    if (!filePath) {
        throw new Error('Failed to save image to disk');
    }

    const image: StoredImage = {
        id: imageId,
        reportId,
        description: sanitizedDesc,
        filePath,
        createdAt: Date.now(),
    };

    // Save metadata to localStorage
    const images = getAllImagesMeta();
    images.push(image);
    saveAllImagesMeta(images);

    return image;
}

// Get images for a report (metadata only)
export function getImagesForReport(reportId: string): StoredImage[] {
    return getAllImagesMeta().filter(img => img.reportId === reportId);
}

// Get a single image by ID
export function getImageById(imageId: string): StoredImage | undefined {
    return getAllImagesMeta().find(img => img.id === imageId);
}

// Delete all images for a report
export async function deleteImagesForReport(reportId: string): Promise<void> {
    const allImages = getAllImagesMeta();
    const toDelete = allImages.filter(img => img.reportId === reportId);
    const remaining = allImages.filter(img => img.reportId !== reportId);

    // Delete files from disk
    for (const img of toDelete) {
        await window.ipcRenderer.invoke('delete-image', img.filePath);
    }

    saveAllImagesMeta(remaining);
}

// Delete a single image
export async function deleteImage(imageId: string): Promise<void> {
    const allImages = getAllImagesMeta();
    const image = allImages.find(img => img.id === imageId);

    if (image) {
        await window.ipcRenderer.invoke('delete-image', image.filePath);
        saveAllImagesMeta(allImages.filter(img => img.id !== imageId));
    }
}

// Update image description
export function updateImageDescription(imageId: string, newDescription: string): void {
    const allImages = getAllImagesMeta();
    const image = allImages.find(img => img.id === imageId);
    if (image) {
        image.description = sanitizeDescription(newDescription) || 'Screenshot';
        saveAllImagesMeta(allImages);
    }
}

// Load image data from disk (returns base64)
// Replace @img-xxx references with URLs
// protocol: 'media' (for app preview/PDF) or 'file' (for external export)
export function replaceImageReferences(text: string, reportImages: StoredImage[], protocol: 'media' | 'file' = 'media'): string {
    return text.replace(/@(img-[a-z0-9]+)/g, (_, id) => {
        const image = reportImages.find(img => img.id === id);
        if (image) {
            // Encode the path
            const path = encodeURIComponent(image.filePath);
            const url = `${protocol}://${path}`;

            // For file protocol (export), standard markdown syntax is often preferred over HTML
            // but HTML is more robust for resizing etc. Let's stick to HTML for consistency for now
            // or maybe standard markdown for file protocol?
            // Let's use HTML for both as it handles spaces in paths better in some parsers
            return `<img src="${url}" alt="${image.description}" />`;
        }
        // Image not found (deleted)
        return `*(Image not found: ${id})*`;
    });
}

// Replace @img-xxx references with Base64 data (async)
// Used for PDF export to avoid network/protocol issues
export async function replaceImageReferencesWithBase64(text: string, reportImages: StoredImage[]): Promise<string> {
    // Find all matches first
    const matches = [...text.matchAll(/@(img-[a-z0-9]+)/g)];
    const uniqueIds = [...new Set(matches.map(m => m[1]))];

    // Load images
    const imageMap = new Map<string, string>();
    for (const id of uniqueIds) {
        const img = reportImages.find(i => i.id === id);
        if (img) {
            try {
                const base64 = await window.ipcRenderer.invoke('load-image', img.filePath);
                if (base64) imageMap.set(id, base64);
            } catch (e) {
                console.error(`Failed to load image ${id} for export`, e);
            }
        }
    }

    return text.replace(/@(img-[a-z0-9]+)/g, (_, id) => {
        const img = reportImages.find(i => i.id === id);
        const base64 = imageMap.get(id);
        if (img && base64) {
            return `<img src="${base64}" alt="${img.description}" />`;
        }
        return `*(Image not found: ${id})*`;
    });
}
