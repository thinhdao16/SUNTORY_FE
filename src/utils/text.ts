export  const isEmptyText = (text: string | null | undefined): boolean => {
    if (!text) return true;
    const trimmedText = text.replace(/\s+/g, '');
    return trimmedText.length === 0 ||
        trimmedText === '' ||
        /^[\s\u200B\u2060\uFEFF]*$/g.test(text);
};