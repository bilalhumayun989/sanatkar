const fs = require('fs');
const path = require('path');

const files = [
    'app/api/admin/seed/route.ts',
    'app/api/auth/forgot-password/route.ts',
    'app/api/auth/reset-password/route.ts',
    'app/api/cars/route.ts',
    'app/api/cars/[id]/route.ts',
    'app/api/orders/route.ts',
    'app/api/orders/[id]/route.ts',
    'app/api/seller/orders/route.ts',
    'app/api/seller/products/route.ts',
    'app/buyer/[id]/page.tsx',
    'app/seller-profile/[id]/page.tsx'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Replace mongoose models imports with Prisma dbConn
        content = content.replace(/import\s+dbConnect\s+from\s+['"]@\/lib\/dbConn['"];?/g, "import prisma from '@/lib/dbConn';");
        content = content.replace(/import\s+\w+\s+from\s+['"]@\/lib\/models\/\w+['"];?\n?/g, "");
        
        // Remove await dbConnect()
        content = content.replace(/await\s+dbConnect\(\);?/g, "// await dbConnect();");
        
        // Change User.findOne -> prisma.user.findFirst (basic placeholder to stop typescript from crying too much)
        // We will manually fix logic later, but this removes module not found errors!
        content = content.replace(/User\./g, "prisma.user.");
        content = content.replace(/Car\./g, "prisma.car.");
        content = content.replace(/Order\./g, "prisma.order.");
        content = content.replace(/Ad\./g, "prisma.ad.");
        content = content.replace(/Category\./g, "prisma.category.");

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${file}`);
    }
});
