/**
 * offerPrice — resolve the price to display for a product, respecting its
 * optional offer-validity window (offerStartDate / offerEndDate).
 *
 * An "offer" here means the discounted `price` (vs the higher `originalPrice`).
 * The offer is only honoured while it is within its validity window:
 *   - active  → show offer price + strikethrough original + discount %
 *   - expired / not yet started → show the regular (original) price, no discount
 *
 * SSR-safe: uses `new Date()` (no browser globals), so it produces the same
 * result on the server and on the client at render time.
 */

export interface OfferPriceProduct {
    price: number;
    originalPrice?: number | null;
    discount?: number | null;
    offerStartDate?: string | Date | null;
    offerEndDate?: string | Date | null;
}

export interface DisplayPrice {
    /** Price the customer pays right now. */
    currentPrice: number;
    /** Strikethrough "was" price — only set while the offer is active. */
    originalPrice?: number;
    /** Discount % — only non-zero while the offer is active. */
    discount: number;
    /** Whether the offer window is currently in effect. */
    offerActive: boolean;
    /** The configured offer end date (if any), for "valid till" messaging. */
    offerEndDate?: Date;
}

const toDate = (value?: string | Date | null): Date | undefined => {
    if (!value) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
};

export function getDisplayPrice(product: OfferPriceProduct): DisplayPrice {
    const now = new Date();
    const start = toDate(product.offerStartDate);
    const end = toDate(product.offerEndDate);

    // If dates are inverted (e.g. end is before start), ignore the invalid dates
    const datesInvalid = !!(start && end && end.getTime() < start.getTime());

    const afterStart = datesInvalid || !start || now.getTime() >= start.getTime();
    const beforeEnd = datesInvalid || !end || now.getTime() <= end.getTime();
    const offerActive = afterStart && beforeEnd;

    const discount = product.discount ?? (
        product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0
    );

    if (offerActive || !product.originalPrice || product.originalPrice <= product.price) {
        return {
            currentPrice: product.price,
            originalPrice: product.originalPrice && product.originalPrice > product.price ? product.originalPrice : undefined,
            discount: discount,
            offerActive: true,
            offerEndDate: !datesInvalid ? end : undefined,
        };
    }

    // Offer expired or not yet started → regular price, no discount.
    const regularPrice =
        product.originalPrice && product.originalPrice > 0
            ? product.originalPrice
            : product.price;

    return {
        currentPrice: regularPrice,
        originalPrice: undefined,
        discount: 0,
        offerActive: false,
        offerEndDate: end,
    };
}
