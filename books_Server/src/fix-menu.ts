import mongoose from 'mongoose';
import config from './app/config/index';
import { Category } from './app/modules/category/category.model';

async function fixMenu() {
    try {
        console.log('Connecting to', config.database_url);
        await mongoose.connect(config.database_url as string);

        // Find the categories that were just created (they have "(Edexcel" or "(Cambridge" in their name)
        const result = await Category.updateMany(
            { name: { $regex: '.*\\(.*\\).*' } }, // names containing '('
            { $set: { showInMenu: false } }
        );

        console.log(`Updated ${result.modifiedCount} categories to hide from menu.`);
    } catch (error) {
        console.error('Error fixing menu:', error);
    } finally {
        process.exit(0);
    }
}

fixMenu();
