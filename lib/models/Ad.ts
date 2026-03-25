import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAd extends Document {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    imageUrl: string;
    badgeText: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AdSchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Please provide an ad title'],
        default: 'Want to Sell Your Car Fast & Extra Easy?'
    },
    description: {
        type: String,
        required: [true, 'Please provide an ad description'],
        default: 'List your vehicle today and get it seen by millions of potential buyers across Pakistan.'
    },
    buttonText: {
        type: String,
        required: [true, 'Please provide button text'],
        default: 'Post an Ad for Free'
    },
    buttonLink: {
        type: String,
        required: [true, 'Please provide button link'],
        default: '/seller'
    },
    imageUrl: {
        type: String,
        required: [true, 'Please provide an image URL'],
        default: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80'
    },
    badgeText: {
        type: String,
        required: [true, 'Please provide badge text'],
        default: 'PROMOTED'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);

export default Ad;
