import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin' | 'seller';
    isVerified: boolean;
    verifyToken?: string;
    verifyTokenExpire?: Date;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    pakwheelsUrl?: string;
    darazUrl?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password should be at least 6 characters'],
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'seller'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verifyToken: String,
    verifyTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    pakwheelsUrl: String,
    darazUrl: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Fix for Next.js HMR: ensure schema updates are applied
if (process.env.NODE_ENV === 'development' && mongoose.models.User) {
    delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
