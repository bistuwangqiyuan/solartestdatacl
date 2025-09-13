import { uniqueNamesGenerator, adjectives, animals, NumberDictionary } from 'unique-names-generator';
import { format, formatDistance, parseISO, isValid } from 'date-fns';

/*
Get the actual size of a resource downloaded by the browser (e.g. an image) in bytes.
This is supported in recent versions of all major browsers, with some caveats.
See https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/encodedBodySize
*/
export function getResourceSize(url) {
    const entry = window?.performance?.getEntriesByName(url)?.[0];
    if (entry) {
        const size = entry?.encodedBodySize;
        return size || undefined;
    } else {
        return undefined;
    }
}

// Note: this only works on the server side
export function getNetlifyContext() {
    return process.env.CONTEXT;
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const uniqueNamesConfig = {
    dictionaries: [adjectives, animals],
    separator: '-',
    length: 2
};

export function uniqueName() {
    return uniqueNamesGenerator(uniqueNamesConfig) + "-" + randomInt(100, 999);
}

export const uploadDisabled = process.env.NEXT_PUBLIC_DISABLE_UPLOADS?.toLowerCase() === "true";

// Date formatting utilities
export function formatDate(date, formatString = 'MMM dd, yyyy') {
    if (!date) return '';
    
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(parsedDate)) return '';
    
    return format(parsedDate, formatString);
}

export function formatRelativeTime(date) {
    if (!date) return '';
    
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(parsedDate)) return '';
    
    return formatDistance(parsedDate, new Date(), { addSuffix: true });
}
