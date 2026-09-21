import { Schema, model } from 'mongoose';

// ── Button inside a group (e.g. "Student Books", "Year-wise QP") ──
const curriculumButtonSchema = new Schema({
    label:        { type: String, required: true },              // Display label
    categorySlug: { type: String, default: '' },                 // Existing category slug to link to
    categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    categorySlugs:[{ type: String }],                            // Multiple slugs for multi-category selection
    categoryIds:  [{ type: Schema.Types.ObjectId, ref: 'Category' }], // Multiple ids
    customLink:   { type: String, default: '' },                 // Optional override link
    order:        { type: Number, default: 0 },
    active:       { type: Boolean, default: true },
}, { _id: true });

// ── Group (e.g. "Edexcel A Level — IAL", "Cambridge AS & A Level") ──
const curriculumGroupSchema = new Schema({
    title:   { type: String, required: true },
    bgColor: { type: String, default: '#D32F2F' },              // Background gradient color
    order:   { type: Number, default: 0 },
    active:  { type: Boolean, default: true },
    buttons: [curriculumButtonSchema],
}, { _id: true });

// ── Curriculum Page (e.g. "A Level", "O Level") ──
const curriculumPageSchema = new Schema(
    {
        title:       { type: String, required: [true, 'Page title is required'], trim: true },
        slug:        { type: String, unique: true, lowercase: true, required: true },
        description: { type: String, default: '' },
        bannerColor: { type: String, default: '#D32F2F' },       // Hero gradient color
        bannerImage: { type: String, default: '' },               // Optional hero background image
        active:      { type: Boolean, default: true },
        order:       { type: Number, default: 0 },
        groups:      [curriculumGroupSchema],
    },
    { timestamps: true }
);

curriculumPageSchema.index({ slug: 1 });
curriculumPageSchema.index({ active: 1, order: 1 });

// Auto-generate slug from title
curriculumPageSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    next();
});

export const CurriculumPage = model('CurriculumPage', curriculumPageSchema);
