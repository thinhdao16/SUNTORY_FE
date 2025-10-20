export const languages = [
    { code: 'vi', label: 'VN' },
    { code: 'en', label: 'EN' },
    { code: 'zh', label: 'ZH' },
];

export const languageMap: Record<string, number> = {
    'vi': 1,    'en': 2,    'zh-cn': 3, 'zh-tw': 4, 'ja': 5,
    'ko': 6,    'th': 7,    'id': 8,    'ms': 9,    'tl': 10,
    'fr': 11,   'de': 12,   'es': 13,   'pt': 14,   'it': 15,
    'ru': 16,   'ar': 17,   'hi': 18,   'bn': 19,   'ur': 20,
    'fa': 21,   'tr': 22,   'nl': 23,   'sv': 24,   'no': 25,
    'da': 26,   'fi': 27,   'pl': 28,   'cs': 29,   'sk': 30,
    'hu': 31,   'ro': 32,   'bg': 33,   'hr': 34,   'sr': 35,
    'sl': 36,   'et': 37,   'lv': 38,   'lt': 39,   'mt': 40,
    
    'vi-vn': 1,    // Vietnamese (Vietnam)
    'en-us': 2,    'en-gb': 2,    'en-au': 2,    // English variants
    'zh-hans': 3,  'zh-hant': 4,  // Chinese variants
    'pt-br': 14,   'pt-pt': 14,   // Portuguese variants
    'es-es': 13,   'es-mx': 13,   'es-ar': 13,   // Spanish variants
    'fr-fr': 11,   'fr-ca': 11,   // French variants
    'de-de': 12,   'de-at': 12,   // German variants
    // Add more as needed...
};