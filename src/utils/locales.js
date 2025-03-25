const locales = {
    // English (default)
    en: {
        chooseMessages: 'Choose how many messages to summarize:',
        generatingSummary: 'Generating summary...',
        noMessages: 'No messages found in the selected time period.',
        summaryCreated: (thread) => `Summary has been created in thread: ${thread}`,
        errorGenerating: 'Sorry, there was an error generating the summary. Please try again later.',
        errorButtons: 'Sorry, there was an error creating the buttons. Please try again later.',
        usageLimitReached: (remaining) => `You have reached your daily usage limit. You have ${remaining} uses remaining.`,
        // Button labels
        last10: 'Last 10',
        last30: 'Last 30',
        last50: 'Last 50',
        last100: 'Last 100',
        last200: 'Last 200',
        today: 'Today',
        yesterday: 'Yesterday',
        last3Days: 'Last 3 Days',
        lastWeek: 'Last Week',
        configCurrent: 'Your current configuration:\nLanguage: {language}',
        configUpdated: 'Configuration updated!\nLanguage set to: {language}',
        errorConfig: 'An error occurred while updating your configuration. Please try again.',
    },
    // Polish
    pl: {
        chooseMessages: 'Wybierz ile wiadomości podsumować:',
        generatingSummary: 'Generowanie podsumowania...',
        noMessages: 'Nie znaleziono wiadomości w wybranym okresie.',
        summaryCreated: (thread) => `Podsumowanie zostało utworzone w wątku: ${thread}`,
        errorGenerating: 'Przepraszam, wystąpił błąd podczas generowania podsumowania. Spróbuj ponownie później.',
        errorButtons: 'Przepraszam, wystąpił błąd podczas tworzenia przycisków. Spróbuj ponownie później.',
        usageLimitReached: (remaining) => `Osiągnąłeś dzienny limit użycia. Pozostało Ci ${remaining} użyć.`,
        // Button labels
        last10: 'Ostatnie 10',
        last30: 'Ostatnie 30',
        last50: 'Ostatnie 50',
        last100: 'Ostatnie 100',
        last200: 'Ostatnie 200',
        today: 'Dzisiaj',
        yesterday: 'Wczoraj',
        last3Days: 'Ostatnie 3 dni',
        lastWeek: 'Ostatni tydzień',
        configCurrent: 'Twoja aktualna konfiguracja:\nJęzyk: {language}',
        configUpdated: 'Konfiguracja zaktualizowana!\nJęzyk ustawiony na: {language}',
        errorConfig: 'Wystąpił błąd podczas aktualizacji konfiguracji. Spróbuj ponownie.',
    }
};

// Helper function to get localized string
function getLocaleString(locale, key, ...args) {
    // Default to English if locale not found
    const strings = locales[locale] || locales.en;
    const string = strings[key] || locales.en[key];

    // If the string is a function (for dynamic content), call it with args
    return typeof string === 'function' ? string(...args) : string;
}

module.exports = {
    getLocaleString
}; 