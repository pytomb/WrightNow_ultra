// Test the text cleaning function
function cleanTextForSpeech(text) {
    if (!text) return '';
    
    const cleaned = text
        // Remove markdown bold formatting
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // Remove markdown italic formatting  
        .replace(/\*(.*?)\*/g, '$1')
        // Remove markdown headers
        .replace(/#{1,6}\s+/g, '')
        // Remove extra asterisks
        .replace(/\*/g, '')
        // Clean up numbered lists (1. 2. etc.)
        .replace(/^\d+\.\s+/gm, '')
        // Remove double spaces
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim();
        
    return cleaned;
}

// Test with example golf advice
const originalText = `**Club Recommendation:** 7-Iron **Key Tips:** 1. **Stance & Alignment:** Ensure your feet, hips, and shoulders are aligned towards the target. A good stance will help you maintain balance. 2. **Grip Pressure:** Keep a light grip on the club.`;

console.log('🧹 Text Cleaning Test:');
console.log('======================');
console.log('\nOriginal text:');
console.log(originalText);
console.log('\nCleaned text:');
console.log(cleanTextForSpeech(originalText));
console.log('\n✅ All markdown formatting removed for natural speech!');

// Test with more examples
const examples = [
    '**Important:** This is *really* important!',
    '### Header Text with content',
    '1. First item\n2. Second item\n3. Third item',
    'Text with   multiple    spaces'
];

console.log('\n🧪 Additional Test Cases:');
examples.forEach((example, index) => {
    console.log(`\nTest ${index + 1}:`);
    console.log(`Input:  "${example}"`);
    console.log(`Output: "${cleanTextForSpeech(example)}"`);
});