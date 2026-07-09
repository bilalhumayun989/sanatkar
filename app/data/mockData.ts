export interface Part {
  id: string;
  brand: string;
  partName: string;
  compatibility: string; // e.g., "Tajima TFMX Series"
  price: number;
  location: string;
  image: string;
  featured?: boolean;
  isFeatured?: boolean;
  sellerRole?: string;
  condition: string; // "New", "Used", etc.
  stockStatus: string;
  category: string;
  createdAt?: string;
  sellerId?: string;
  sellerName?: string;
}

export const mockCars: any[] = [ // Keeping name as mockCars for now to avoid breaking imports everywhere immediately, but updating content
  {
    id: "1",
    brand: "Tajima",
    partName: "Rotary Hook (KHS12-RYP)",
    compatibility: "TFMX / TMEZ Series",
    price: 8500,
    location: "Faisalabad",
    image: "https://s.alicdn.com/@sc04/kf/Hfb14bac844d64d7999c004f8b988e1957/KHS12-RYP-Regular-L-Sized-Steel-Metal-Rotary-Hook-Standard-Tajima-Barudan-SWF-Feiya-China-Embroidery-Machine-Parts-Model.jpg",
    featured: true,
    condition: "New",
    stockStatus: "In Stock",
    category: "Hooks",
  },
  {
    id: "2",
    brand: "Barudan",
    partName: "Main Motor Belt",
    compatibility: "BEMS / BEMR Series",
    price: 4500,
    location: "Lahore",
    image: "https://s.alicdn.com/@sc04/kf/H99fca0cf9b0341c585f32264556c11c5r/Good-Quality-Tajima-Embroidery-Machine-Spare-Parts-Genuine-Japanese-MBL-Main-Shaft-Motor-Belt-S5M1115-Width-35mm.jpg",
    featured: true,
    condition: "New",
    stockStatus: "Limited",
    category: "Belts",
  },
  {
    id: "3",
    brand: "Janome",
    partName: "Solenoid Valve Assembly",
    compatibility: "MB-4 / MB-7",
    price: 12500,
    location: "Karachi",
    image: "https://www.sewingpartsonline.com/cdn/shop/files/846640004.jpg",
    featured: true,
    condition: "Refurbished",
    stockStatus: "1 Left",
    category: "Electronics",
  },
  {
    id: "4",
    brand: "Groz-Beckert",
    partName: "Needles DBxK5 (Pack of 100)",
    compatibility: "Universal Industrial",
    price: 2200,
    location: "Islamabad",
    image: "https://m.media-amazon.com/images/I/61320vDIPHL.jpg",
    featured: true,
    condition: "New",
    stockStatus: "Bulk Available",
    category: "Needles",
  },
];

export const stats = {
  totalParts: "15,000+",
  totalUsers: "8,500+",
  activeAds: "1,200+",
  citiesCovered: "25+",
};
