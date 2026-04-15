import dbConnect from './lib/dbConn';
import User from './lib/models/User';

async function checkUser() {
    await dbConnect();
    const users = await User.find({}).sort({ createdAt: -1 }).limit(1);
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

checkUser();
-+