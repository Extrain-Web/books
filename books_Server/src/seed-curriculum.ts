import mongoose from 'mongoose';
import config from './app/config/index';
import { CurriculumPage } from './app/modules/curriculumPage/curriculumPage.model';

async function seedCurriculum() {
    try {
        console.log('Connecting to', config.database_url);
        await mongoose.connect(config.database_url as string);

        // --- O Level ---
        const oLevelSlug = 'o-level';
        let oLevel = await CurriculumPage.findOne({ slug: oLevelSlug });
        if (!oLevel) {
            oLevel = new CurriculumPage({
                title: 'O Level',
                slug: oLevelSlug,
                bannerColor: '#6C2E00',
                groups: [
                    {
                        title: 'Edexcel IGCSE — O Level',
                        bgColor: '#8B3A2C',
                        buttons: [
                            { label: 'Student Books' },
                            { label: 'Year-wise QP' },
                            { label: 'Unique Chapterwise QP' },
                            { label: 'Mark Schemes' },
                            { label: 'Lab Book' },
                            { label: 'Reference Book' },
                        ]
                    },
                    {
                        title: 'Cambridge IGCSE / O Level',
                        bgColor: '#F08418',
                        buttons: [
                            { label: 'Course Book' },
                            { label: 'Reference Book' },
                            { label: 'IGCSE Year-wise QP' },
                            { label: 'O Level Year-wise QP' },
                            { label: 'IGCSE Mark Schemes' },
                            { label: 'O Level Mark Schemes' },
                            { label: 'IGCSE Redspot' },
                            { label: 'O Level Redspot' },
                        ]
                    }
                ]
            });
            await oLevel.save();
            console.log('O Level created.');
        } else {
            console.log('O Level already exists.');
        }

        // --- A Level ---
        const aLevelSlug = 'a-level';
        let aLevel = await CurriculumPage.findOne({ slug: aLevelSlug });
        if (!aLevel) {
            aLevel = new CurriculumPage({
                title: 'A Level',
                slug: aLevelSlug,
                bannerColor: '#6C2E00',
                groups: [
                    {
                        title: 'Edexcel A Level — IAL',
                        bgColor: '#D32F2F',
                        buttons: [
                            { label: 'Student Books' },
                            { label: 'Year-Wise QP' },
                            { label: 'Reference Book' },
                            { label: 'Unique Chapterwise QP' },
                            { label: 'Mark Schemes' },
                        ]
                    },
                    {
                        title: 'Cambridge AS & A Level',
                        bgColor: '#1B7A43',
                        buttons: [
                            { label: 'Course Books' },
                            { label: 'Reference Book' },
                            { label: 'Year-Wise QP' },
                            { label: 'Redspot' },
                            { label: 'Mark Schemes' },
                        ]
                    }
                ]
            });
            await aLevel.save();
            console.log('A Level created.');
        } else {
            console.log('A Level already exists.');
        }

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        process.exit(0);
    }
}

seedCurriculum();
