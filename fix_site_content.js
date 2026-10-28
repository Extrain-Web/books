const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'books_Server/src/app/modules/siteContent/siteContent.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard names
content = content.replace(/Bichitra Point/g, 'Books River');
content = content.replace(/bichitrapoint\.com/g, 'booksriver.com');
content = content.replace(/bichitrapoint/g, 'booksriver');

// Add auto-migrate block for logo and favicon
const autoMigrateStr = `
        // Auto-migrate: clear Bichitra logos
        if (content?.theme?.logoUrl?.includes('Bichitra') || content?.theme?.faviconUrl?.includes('Bichitra') || content?.general?.storeName === 'Bichitra Point') {
            const updateObj = {};
            if (content?.theme?.logoUrl?.includes('Bichitra')) {
                updateObj['theme.logoUrl'] = '';
            }
            if (content?.theme?.faviconUrl?.includes('Bichitra')) {
                updateObj['theme.faviconUrl'] = '';
            }
            if (content?.general?.storeName === 'Bichitra Point') {
                updateObj['general.storeName'] = 'Books River';
            }
            if (Object.keys(updateObj).length > 0) {
                content = await SiteContent.findOneAndUpdate(
                    { _key: 'main' },
                    { $set: updateObj },
                    { new: true }
                );
            }
        }
`;

// Insert auto-migrate before return content;
if (!content.includes('clear Bichitra logos')) {
    content = content.replace(/return content;\s*},\s*\/\/\s*Update site content/g, autoMigrateStr + '\n        return content;\n    },\n\n    // Update site content');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully.');
