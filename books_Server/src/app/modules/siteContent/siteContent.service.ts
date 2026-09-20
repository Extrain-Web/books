import { SiteContent } from './siteContent.model';

const SiteContentService = {
    // Get site content (creates default if not exists)
    async get() {
        let content = await SiteContent.findOne({ _key: 'main' });
        if (!content) {
            content = await SiteContent.create({
                _key: 'main',
                ticker: [
                    { text: 'Supply', emoji: '', active: true, order: 0 },
                    { text: 'Solution', emoji: '', active: true, order: 1 },
                    { text: 'Satisfaction', emoji: '', active: true, order: 2 },
                    { text: '🎉 Special Offer: Get 50% OFF on all Electronics! Limited Time Only!', emoji: '🎉', active: true, order: 3 },
                    { text: '🚚 Free Shipping on orders over Tk.1499', emoji: '🚚', active: true, order: 4 },
                    { text: '💳 Extra 10% Cashback with bKash Payment', emoji: '💳', active: true, order: 5 },
                ],
                contact: {
                    phone: '01739498553',
                    phones: ['01739498553'],
                    // Not set yet — the WhatsApp card, footer live-chat link and
                    // floating button stay hidden until a number is added.
                    whatsapp: '',
                    email: 'support@bichitrapoint.com',
                    emails: ['support@bichitrapoint.com'],
                    address: '6 Kalabagan, Bus Stand, Dhaka-1205, Bangladesh',
                    corporateOffice: '6 Kalabagan, Bus Stand, Dhaka-1205, Bangladesh',
                    website: 'bichitrapoint.com',
                    hours: [
                        { day: 'Sunday – Saturday', time: '9:00 AM – 6:00 PM' },
                        { day: 'Friday', time: 'Closed' },
                    ],
                    tips: [
                        'Have your order ID ready for faster support',
                        'Attach screenshots for product issues',
                    ],
                    socials: [
                        { label: 'Facebook', url: '#', color: '#1877F2' },
                        { label: 'Instagram', url: '#', color: '#E1306C' },
                        { label: 'YouTube', url: '#', color: '#FF0000' },
                    ],
                    subjects: ['Order Issue', 'Product Inquiry', 'Return / Refund', 'Delivery Problem', 'Payment Issue', 'Other'],
                },
                floating: {
                    phone: '01739498553',
                    whatsapp: '',
                    messenger: 'YOUR_PAGE_USERNAME',
                    showPhone: true,
                    showWhatsapp: true,
                    showMessenger: true,
                },
                general: {
                    storeName: 'Bichitra Point',
                    tagline: 'Your trusted online marketplace',
                    currency: 'BDT',
                },
                footer: {
                    companyName: 'Bichitra Point',
                    copyright: '',
                    links: [],
                },
                defaultTagline: 'Your trusted online marketplace',
                seo: {
                    title: 'Bichitra Point - Your trusted online marketplace',
                    description: 'Shop the latest products with amazing deals at Bichitra Point. Premium quality products at best prices.',
                    keywords: 'bichitra point, bichitrapoint, ecommerce, online shopping, best deals, products, shop',
                },
                announcement: {
                    message: '',
                    bgColor: '#E4525C',
                    textColor: '#FFFFFF',
                    active: false,
                    dismissible: true,
                },
                legalPages: [
                    { slug: 'about', title: 'About Us', content: '<p>Welcome to Bichitra Point.</p>', active: true },
                    { slug: 'terms', title: 'Terms & Conditions', content: '<p>Please add your Terms & Conditions content here.</p>', active: true },
                    { slug: 'privacy', title: 'Privacy Policy', content: '<p>Please add your Privacy Policy content here.</p>', active: true },
                    { slug: 'refund', title: 'Refund Policy', content: '<p>Please add your Refund Policy content here.</p>', active: true },
                ],
            });
        }

        // Auto-migrate: ensure legalPages exist and have real content
        const needsSeed = !content.legalPages || (content.legalPages as any[]).length === 0
            || (content.legalPages as any[]).every((p: any) => !p.content || p.content.replace(/<[^>]*>/g, '').trim().length < 200);

        if (needsSeed) {
            content = await SiteContent.findOneAndUpdate(
                { _key: 'main' },
                {
                    $set: {
                        legalPages: [
                            {
                                slug: 'about', title: 'About Us', active: true, lastUpdated: new Date(),
                                content: `<h2>Welcome to Bichitra Point</h2><p>Bichitra Point is a premier retail and wholesale marketplace in Bangladesh, dedicated to providing high-quality authentic products, books, stationery, natural goods, and daily essentials.</p><h2>Our Mission</h2><p>Our mission is to deliver authentic, top-grade items with maximum reliability, fast delivery, and unmatched customer service across Bangladesh.</p><h2>Why Choose Us?</h2><ul><li><strong>100% Genuine Products:</strong> We guarantee authenticity for all items listed on our platform.</li><li><strong>Wholesale & Retail:</strong> Flexible purchasing for individual customers, schools, madrasahs, retailers, and corporate clients.</li><li><strong>Fast & Safe Shipping:</strong> Nationwide delivery with secure packaging and real-time tracking.</li><li><strong>Dedicated Customer Support:</strong> Prompt support team ready to assist you via phone, WhatsApp, and email.</li></ul><h2>Contact Us</h2><p>For wholesale inquiries or general support, reach out to us at <strong>support@bichitrapoint.com</strong> or call <strong>+880 1739-498553</strong>.</p>`,
                            },
                            {
                                slug: 'terms', title: 'Terms & Conditions', active: true, lastUpdated: new Date(),
                                content: `<h2>1. Acceptance of Terms</h2><p>By accessing and using the Bichitra Point website and its services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website or services.</p><p>We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the updated terms.</p><h2>2. Services Overview</h2><p>Bichitra Point provides an online retail and wholesale marketplace connecting customers with quality products. Our services include:</p><ul><li><strong>Direct Purchase</strong> — Browse and buy products directly through our platform.</li><li><strong>Wholesale Supply</strong> — Bulk ordering for educational institutions, businesses, and retailers.</li><li><strong>Order Delivery</strong> — Nationwide reliable delivery to your address.</li><li><strong>Customer Support</strong> — Dedicated assistance with orders, payments, and product inquiries.</li></ul><h2>3. User Accounts & Registration</h2><p>To place orders, you may be required to create an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.</p><h2>4. Pricing & Payment</h2><p>All prices displayed on the website are in Bangladeshi Taka (BDT). We accept Cash on Delivery (COD), bKash, Nagad, bank transfer, and cards.</p><h2>5. Contact Information</h2><p>For any queries regarding these terms, please contact us at <strong>support@bichitrapoint.com</strong> or <strong>+880 1739-498553</strong>.</p>`,
                            },
                            {
                                slug: 'privacy', title: 'Privacy Policy', active: true, lastUpdated: new Date(),
                                content: `<h2>1. Information We Collect</h2><p>We collect information to provide better services to our users:</p><ul><li><strong>Personal Information:</strong> Name, email address, phone number, shipping address, and billing information.</li><li><strong>Account Data:</strong> Login credentials, order history, and preferences.</li><li><strong>Device Information:</strong> IP address, browser type, and cookies for analytics.</li></ul><h2>2. How We Use Your Information</h2><ul><li>To process, fulfill, and track your orders.</li><li>To provide customer support and service updates.</li><li>To prevent fraud and maintain system security.</li></ul><h2>3. Contact Us</h2><p>For privacy inquiries, contact us at <strong>support@bichitrapoint.com</strong>.</p>`,
                            },
                            {
                                slug: 'refund', title: 'Refund Policy', active: true, lastUpdated: new Date(),
                                content: `<h2>1. Overview</h2><p>At Bichitra Point, customer satisfaction is our top priority. This Refund Policy outlines the terms for returns and exchanges.</p><h2>2. Eligibility for Returns</h2><ul><li>Product is damaged, defective, or incorrect upon arrival.</li><li>Return request is submitted within <strong>7 days</strong> of delivery with proof of purchase.</li></ul><h2>3. Contact Us</h2><p>For refund assistance, email us at <strong>support@bichitrapoint.com</strong> or call <strong>+880 1739-498553</strong>.</p>`,
                            },
                        ],
                    },
                },
                { new: true }
            );
        }

        // Auto-migrate: ensure 'about' page exists in legalPages
        const hasAboutPage = (content.legalPages as any[])?.some((p: any) => p.slug === 'about');
        if (!hasAboutPage) {
            content = await SiteContent.findOneAndUpdate(
                { _key: 'main' },
                {
                    $push: {
                        legalPages: {
                            slug: 'about',
                            title: 'About Us',
                            active: true,
                            lastUpdated: new Date(),
                            content: `<h2>Welcome to Bichitra Point</h2><p>Bichitra Point is a premier retail and wholesale marketplace in Bangladesh, dedicated to providing high-quality authentic products, books, stationery, natural goods, and daily essentials.</p><h2>Our Mission</h2><p>Our mission is to deliver authentic, top-grade items with maximum reliability, fast delivery, and unmatched customer service across Bangladesh.</p><h2>Why Choose Us?</h2><ul><li><strong>100% Genuine Products:</strong> We guarantee authenticity for all items listed on our platform.</li><li><strong>Wholesale & Retail:</strong> Flexible purchasing for individual customers, schools, madrasahs, retailers, and corporate clients.</li><li><strong>Fast & Safe Shipping:</strong> Nationwide delivery with secure packaging and real-time tracking.</li><li><strong>Dedicated Customer Support:</strong> Prompt support team ready to assist you via phone, WhatsApp, and email.</li></ul><h2>Contact Us</h2><p>For wholesale inquiries or general support, reach out to us at <strong>support@bichitrapoint.com</strong> or call <strong>+880 1739-498553</strong>.</p>`,
                        },
                    },
                },
                { new: true }
            );
        }

        // NOTE: there used to be two "auto-migrate" blocks here that back-filled
        // hardcoded phone/email/website/WhatsApp values on every read. They fought
        // the admin: clearing a number in Settings silently resurrected the old one
        // on the next request. Seeding belongs in the defaults above (used only when
        // the document is first created) — an empty field is a valid choice and must
        // be respected.

        // Auto-migrate: ensure payment object exists
        if (!content.get('payment')) {
            content = await SiteContent.findOneAndUpdate(
                { _key: 'main' },
                {
                    $set: {
                        payment: {
                            bkash: { number: '', accountType: 'Personal', active: true },
                            rocket: { number: '', accountType: 'Personal', active: true },
                            nagad: { number: '', accountType: 'Personal', active: true },
                            cod: { active: true },
                            instructions: 'Send Money to the number above, then submit your number, transaction ID and payment time below.',
                        },
                    },
                },
                { new: true }
            );
        }

        // Auto-migrate: replace old contact phone if it contains 01711870439
        if (
            content?.contact?.phone === '01711870439' ||
            (Array.isArray(content?.contact?.phones) && content?.contact?.phones.includes('01711870439')) ||
            content?.floating?.phone === '01711870439'
        ) {
            const updatedPhones = Array.isArray(content?.contact?.phones)
                ? content?.contact?.phones.map((p: string) => (p === '01711870439' ? '01739498553' : p))
                : ['01739498553'];
            const updatedPhone = content?.contact?.phone === '01711870439' ? '01739498553' : (content?.contact?.phone || '01739498553');
            const updatedFloatingPhone = content?.floating?.phone === '01711870439' ? '01739498553' : content?.floating?.phone;

            content = await SiteContent.findOneAndUpdate(
                { _key: 'main' },
                {
                    $set: {
                        'contact.phone': updatedPhone,
                        'contact.phones': updatedPhones,
                        'floating.phone': updatedFloatingPhone,
                    },
                },
                { new: true }
            );
        }

        // Auto-migrate: populate default categoryRows if empty or unset
        if (!content?.categoryRows || content.categoryRows.length === 0) {
            const defaultRows = [
                { categoryName: 'Past Papers', categorySlug: 'past-papers', subtitle: '', active: true, order: 0 },
                { categoryName: 'Cambridge Course Book', categorySlug: 'cambridge-course-book', subtitle: '', active: true, order: 1 },
                { categoryName: 'Edexcel Student Book', categorySlug: 'edexcel-student-book', subtitle: '', active: true, order: 2 },
                { categoryName: 'Childrens Books', categorySlug: 'childrens-books', subtitle: '', active: true, order: 3 },
                { categoryName: 'Story Books', categorySlug: 'story-books', subtitle: '', active: true, order: 4 },
            ];
            content = await SiteContent.findOneAndUpdate(
                { _key: 'main' },
                { $set: { categoryRows: defaultRows } },
                { new: true }
            );
        }

        return content;
    },

    // Update site content (partial update)
    async update(data: any) {
        const content = await SiteContent.findOneAndUpdate(
            { _key: 'main' },
            { $set: data },
            { new: true, upsert: true, runValidators: true }
        );
        return content;
    },

    // Update a specific section
    async updateSection(section: string, data: any) {
        const updateObj: any = {};
        updateObj[section] = data;
        const content = await SiteContent.findOneAndUpdate(
            { _key: 'main' },
            { $set: updateObj },
            { new: true, upsert: true, runValidators: true }
        );
        return content;
    },

    // Get a single legal page by slug
    async getLegalPage(slug: string) {
        // Call get() first to trigger auto-migration if needed
        const content = await this.get();
        if (!content || !content.legalPages) return null;
        const page = (content.legalPages as any[]).find((p: any) => p.slug === slug);
        return page || null;
    },

    // Update a single legal page by slug
    async updateLegalPage(slug: string, data: { title?: string; content?: string; active?: boolean }) {
        // First check if the legal page exists
        const content = await SiteContent.findOne({ _key: 'main' });
        if (!content) return null;

        const pageIndex = (content.legalPages as any[])?.findIndex((p: any) => p.slug === slug);

        if (pageIndex === -1 || pageIndex === undefined) {
            // Page doesn't exist, push it
            const newPage = { slug, title: data.title || slug, content: data.content || '', active: data.active !== false, lastUpdated: new Date() };
            const updated = await SiteContent.findOneAndUpdate(
                { _key: 'main' },
                { $push: { legalPages: newPage } },
                { new: true }
            );
            return updated?.legalPages?.find((p: any) => p.slug === slug);
        }

        // Update existing page
        const updateObj: any = {};
        if (data.title !== undefined) updateObj[`legalPages.${pageIndex}.title`] = data.title;
        if (data.content !== undefined) updateObj[`legalPages.${pageIndex}.content`] = data.content;
        if (data.active !== undefined) updateObj[`legalPages.${pageIndex}.active`] = data.active;
        updateObj[`legalPages.${pageIndex}.lastUpdated`] = new Date();

        const updated = await SiteContent.findOneAndUpdate(
            { _key: 'main' },
            { $set: updateObj },
            { new: true }
        );
        return updated?.legalPages?.find((p: any) => p.slug === slug);
    },

    // Get all legal pages (for admin listing)
    async getAllLegalPages() {
        const content = await SiteContent.findOne({ _key: 'main' });
        return content?.legalPages || [];
    },
};

export default SiteContentService;

