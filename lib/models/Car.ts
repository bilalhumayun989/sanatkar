import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICar {
    make: string;
    model: string;
    year: number;
    price: number;
    description: string;
    images: string[];
    seller: mongoose.Types.ObjectId;
    condition: 'new' | 'used' | 'refurbished';
    fuelType?: string;
    transmission?: string;
    category?: string;
    mileage: number;
    location: string;
    status: 'available' | 'sold';
    createdAt: Date;
}

const CarSchema: Schema = new Schema({
    make: {
        type: String,
        required: [true, 'Please provide the make of the car (e.g. Toyota)'],
    },
    model: {
        type: String,
        required: [true, 'Please provide the model of the car'],
    },
    year: {
        type: Number,
        required: [true, 'Please provide the year of the car'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide the price'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    images: {
        type: [String],
        default: [],
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    condition: {
        type: String,
        enum: ['new', 'used', 'refurbished'],
        required: true,
    },
    fuelType: {
        type: String,
        default: '',
    },
    transmission: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        default: '',
    },
    mileage: {
        type: Number,
        default: 0,
    },
    location: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'sold'],
        default: 'available',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Car: Model<ICar> = mongoose.models.Car || mongoose.model<ICar>('Car', CarSchema);

export default Car;
