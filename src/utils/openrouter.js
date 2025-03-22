const axios = require('axios');

async function generateSummary(messages) {
    try {
        // Format messages to include user interactions
        const formattedMessages = messages.map(msg => ({
            author: msg.author.username,
            content: msg.content,
            timestamp: msg.createdAt.toISOString()
        }));

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'deepseek/deepseek-r1',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant that summarizes Discord conversations in Polish language.
                    Create a clear, structured summary using bullet points (•), where each point represents:
                    • A single topic of discussion
                    • A specific user interaction or exchange
                    • A shared resource or link
                    • A question and its answer
                    • A key decision or conclusion
                    
                    Format each bullet point to show user interactions clearly, for example:
                    • UserX rozpoczął dyskusję na temat [topic], dzieląc się [specific detail]
                    • UserY i UserZ wymienili się doświadczeniami odnośnie [topic], skupiając się na [specific aspect]
                    • W odpowiedzi na pytanie UserX o [topic], UserY wyjaśnił że [explanation]
                    • UserX udostępnił link do [resource] dotyczący [topic]
                    
                    Make each bullet point focused and concise, capturing one clear thought or interaction.
                    Keep the tone conversational but informative.
                    Always write in Polish language.`
                },
                {
                    role: 'user',
                    content: `Please summarize this Discord conversation in a bullet-point list. Here are the messages in chronological order:\n\n${
                        formattedMessages.map(msg => 
                            `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.author}: ${msg.content}`
                        ).join('\n')
                    }`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating summary:', error);
        throw new Error('Failed to generate summary');
    }
}

module.exports = {
    generateSummary
}; 