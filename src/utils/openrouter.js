const axios = require('axios');

// System prompts for different languages
const systemPrompts = {
    pl: (messageLinkTemplate) => `Jesteś pomocnym asystentem, który podsumowuje konwersacje z Discorda w języku polskim.
        Stwórz przejrzyste, uporządkowane podsumowanie używając składni listy Markdown, gdzie każdy punkt reprezentuje odrębny temat lub interakcję.
        
        WAŻNE: NIGDY nie wymieniaj użytkowników ani ról w podsumowaniu. Zamiast tego używaj ogólnych opisów.
        
        Wymagania formatowania:
        1. Rozpocznij każdy punkt od "- " (myślnik i spacja)
        2. Umieść każdy punkt w nowej linii
        3. Dodaj pustą linię między punktami
        4. Dla każdego punktu dodaj link do odpowiedniej wiadomości używając formatu: ${messageLinkTemplate}
        5. Użyj dokładnie tego formatu:
        
        - Pierwszy punkt tutaj ${messageLinkTemplate}
        
        - Drugi punkt tutaj ${messageLinkTemplate}
        
        - Trzeci punkt tutaj ${messageLinkTemplate}
        
        Przykładowe punkty:
        - Rozpoczęto dyskusję na temat [temat], dzieląc się [szczegół] ${messageLinkTemplate}
        
        - Wymieniono się doświadczeniami odnośnie [temat], skupiając się na [aspekt] ${messageLinkTemplate}
        
        - W odpowiedzi na pytanie o [temat], wyjaśniono że [wyjaśnienie] ${messageLinkTemplate}
        
        - Udostępniono link do [zasób] dotyczący [temat] ${messageLinkTemplate}
        
        Każdy punkt powinien być zwięzły i skupiony na jednej myśli lub interakcji.
        Zachowaj konwersacyjny, ale informacyjny ton.
        Zawsze pisz w języku polskim.
        Zawsze zachowuj odpowiednie odstępy między punktami.
        Zawsze dołączaj link do wiadomości dla każdego punktu.
        NIGDY nie wymieniaj użytkowników ani ról w podsumowaniu.`,

    en: (messageLinkTemplate) => `You are a helpful assistant that summarizes Discord conversations in English.
        Create a clear, structured summary using Markdown list syntax, where each point represents a distinct topic or interaction.
        
        IMPORTANT: NEVER mention users or roles in the summary. Instead, use general descriptions.
        
        Format requirements:
        1. Start each point with "- " (hyphen followed by space)
        2. Place each point on a new line
        3. Add an empty line between points
        4. For each point, include a link to the relevant message using the format: ${messageLinkTemplate}
        5. Use this exact format:
        
        - First point here ${messageLinkTemplate}
        
        - Second point here ${messageLinkTemplate}
        
        - Third point here ${messageLinkTemplate}
        
        Example points:
        - Started a discussion about [topic], sharing [specific detail] ${messageLinkTemplate}
        
        - Exchanged experiences about [topic], focusing on [specific aspect] ${messageLinkTemplate}
        
        - In response to a question about [topic], it was explained that [explanation] ${messageLinkTemplate}
        
        - Shared a link to [resource] regarding [topic] ${messageLinkTemplate}
        
        Make each point focused and concise, capturing one clear thought or interaction.
        Keep the tone conversational but informative.
        Always write in English.
        Always maintain proper spacing between points.
        Always include a message link for each point.
        NEVER mention users or roles in the summary.`
};

// Split text into chunks while preserving list items
function splitIntoChunks(text, maxLength = 1000) {
    const chunks = [];
    let currentChunk = '';
    
    // Split by double newlines to preserve list formatting
    const sections = text.split(/\n\n/);
    
    for (const section of sections) {
        // If adding this section would exceed the limit, start a new chunk
        if (currentChunk.length + section.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = section;
        } else {
            // Add section to current chunk with proper spacing
            currentChunk += (currentChunk ? '\n\n' : '') + section;
        }
    }
    
    // Add the last chunk if it exists
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

// Add request timeout and retry configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function makeRequestWithRetry(url, data, retries = MAX_RETRIES) {
    try {
        const response = await axios.post(url, data, {
            timeout: REQUEST_TIMEOUT,
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
            console.log(`Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return makeRequestWithRetry(url, data, retries - 1);
        }
        throw error;
    }
}

async function generateSummary(messages, guildId, channelId, locale = 'en') {
    try {
        // Validate IDs
        if (!guildId || !channelId) {
            console.error('Missing required IDs:', { guildId, channelId });
            throw new Error('Missing required guild or channel ID');
        }

        // Debug logging
        console.log('Generating summary with IDs:', { guildId, channelId });

        // Format messages to include user interactions and message IDs
        const formattedMessages = messages.map(msg => ({
            author: msg.author.username,
            content: msg.content,
            timestamp: msg.createdAt.toISOString(),
            id: msg.id
        }));

        // Create the message link template with actual IDs
        const messageLinkTemplate = `https://discord.com/channels/${guildId}/${channelId}/{message_id}`;
        console.log('Message link template:', messageLinkTemplate);

        // Validate message link template
        if (messageLinkTemplate.includes('undefined')) {
            console.error('Invalid message link template:', messageLinkTemplate);
            throw new Error('Invalid message link template generated');
        }

        // Get the appropriate system prompt based on locale (default to English)
        const systemPrompt = (systemPrompts[locale] || systemPrompts.en)(messageLinkTemplate);

        console.log('System prompt with template:', systemPrompt);

        const response = await makeRequestWithRetry(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemini-2.5-pro-preview-03-25',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Please summarize this Discord conversation with proper line spacing between points and message links. Here are the messages in chronological order:\n\n${
                            formattedMessages.map(msg => 
                                `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.author}: ${msg.content} (ID: ${msg.id})`
                            ).join('\n')
                        }`
                    }
                ],
                temperature: 0.7,
                max_tokens: 0
            }
        );

        // Process the response to ensure proper formatting
        let summary = response.choices[0].message.content;
        
        // Ensure proper line breaks between points
        summary = summary.replace(/^-/gm, '\n-').trim();
        // Remove any triple line breaks that might have been created
        summary = summary.replace(/\n\n\n+/g, '\n\n');
        
        // Split the summary into chunks if needed
        return splitIntoChunks(summary);
    } catch (error) {
        console.error('Error generating summary:', error);
        throw error;
    }
}

module.exports = {
    generateSummary
}; 