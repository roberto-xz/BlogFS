
// [~] coded by roberto-xz

export function normalizeInput(text: string): string {
    return text.replace(/^[\s\r\n]+|[\s\r\n]+$/g, '');
}
