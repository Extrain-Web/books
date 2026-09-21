import mongoose from 'mongoose';
import config from './app/config/index';
import { CurriculumPage } from './app/modules/curriculumPage/curriculumPage.model';
import { Category } from './app/modules/category/category.model';

async function mapCategoriesToCurriculum() {
    try {
        console.log('Connecting to', config.database_url);
        await mongoose.connect(config.database_url as string);

        const pages = await CurriculumPage.find({});
        let updatedCount = 0;

        for (const page of pages) {
            let pageUpdated = false;

            for (const group of page.groups) {
                if (!group.buttons) continue;

                for (const button of group.buttons as any[]) {
                    if (!button.categoryId || !button.categorySlug) {
                        // Create a unique category name for this button
                        // e.g., "O Level - Edexcel IGCSE - Student Books"
                        // But maybe keep it shorter: "Student Books (Edexcel IGCSE O Level)"
                        const categoryName = `${button.label} (${group.title})`;
                        let categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                        // Check if category already exists
                        let category = await Category.findOne({ slug: categorySlug });
                        if (!category) {
                            category = new Category({
                                name: categoryName,
                                slug: categorySlug,
                                description: `Category for Curriculum: ${page.title} > ${group.title} > ${button.label}`,
                                showInHome: false, // Don't crowd the home page category list with these very specific ones
                            });
                            await category.save();
                            console.log(`Created new category: ${categoryName}`);
                        }

                        // Link button to this category
                        button.categoryId = category._id;
                        button.categorySlug = category.slug;
                        pageUpdated = true;
                    }
                }
            }

            if (pageUpdated) {
                await page.save();
                updatedCount++;
                console.log(`Updated curriculum page: ${page.title}`);
            }
        }

        console.log(`Done. Updated ${updatedCount} curriculum pages.`);

    } catch (error) {
        console.error('Error linking categories:', error);
    } finally {
        process.exit(0);
    }
}

mapCategoriesToCurriculum();
