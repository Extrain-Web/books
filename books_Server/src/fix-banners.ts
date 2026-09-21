import mongoose from 'mongoose';
import config from './app/config/index';
import { SiteContent } from './app/modules/siteContent/siteContent.model';

async function fix() {
    try {
        console.log('Connecting to', config.database_url);
        await mongoose.connect(config.database_url as string);
        
        const siteContent: any = await SiteContent.findOne({ _key: 'main' });
        if (siteContent) {
            let updated = false;
            if (siteContent.collectionBanners) {
                siteContent.collectionBanners.forEach((b: any) => {
                    // Update O Level and A Level banners. If there is no title, maybe check the image url?
                    // We'll just update the first two banners manually, since usually there are 2.
                    if (b.imageUrl) {
                        if (b.link && (b.link.includes('o-level') || b.link.includes('a-level'))) {
                            // already fine
                        } else {
                            if (b.title && b.title.toLowerCase().includes('o level')) {
                                b.link = '/curriculum/o-level';
                                updated = true;
                            } else if (b.title && b.title.toLowerCase().includes('a level')) {
                                b.link = '/curriculum/a-level';
                                updated = true;
                            } else {
                                // Fallback: just assign by order assuming O Level is 1 and A Level is 2.
                                // It's safer to just set based on index if there are exactly 2 banners and they have no title.
                                console.log('Banner with link:', b.link, 'title:', b.title);
                            }
                        }
                    }
                });
                
                // If the banners don't have titles, we can assume the first one is O Level and the second is A Level based on the user's screenshot.
                if (!updated && siteContent.collectionBanners.length === 2) {
                    siteContent.collectionBanners[0].link = '/curriculum/o-level';
                    siteContent.collectionBanners[1].link = '/curriculum/a-level';
                    updated = true;
                }
            }
            if (updated) {
                await siteContent.save();
                console.log('Banners updated successfully');
            } else {
                console.log('No matching banners found or already updated');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
fix();
