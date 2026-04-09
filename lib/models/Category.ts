import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory {
    name: string;
    isPopular: boolean;
    createdAt: Date;
}

const CategorySchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide the category name'],
        unique: true,
        trim: true,
    },
    isPopular: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
