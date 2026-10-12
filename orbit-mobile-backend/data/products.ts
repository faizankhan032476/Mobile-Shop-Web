import type { ColorOption } from "@/types";

/** Seed-only shape used by scripts/generate-seed.mts. The live app reads products from the database. */
export type Category = "Flagship" | "Mid-range" | "Budget" | "Foldable";
export interface SeedProduct { id: string; name: string; brand: string; category: Category; price: number; originalPrice?: number; stock: number; rating: number; reviewCount: number; popularity: number; createdAt: string; featured: boolean; onSale: boolean; colors: ColorOption[]; storage: string[]; description: string; specs: Record<string, string> }

// DEMO CATALOG: prices are illustrative PKR figures and stock counts are fictional.
const c = (name: string, hex: string) => ({ name, hex });
const spec = (display: string, chip: string, camera: string, battery: string, os: string) => ({
  Display: display, Processor: chip, Camera: camera, Battery: battery, "Operating system": os,
});

export const CATEGORIES: { name: Category; blurb: string }[] = [
  { name: "Flagship", blurb: "Top cameras and chips" },
  { name: "Mid-range", blurb: "The sensible sweet spot" },
  { name: "Budget", blurb: "Big battery, small price" },
  { name: "Foldable", blurb: "Two screens in one" },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: "iphone-16-pro-max", name: "Apple iPhone 16 Pro Max", brand: "Apple", category: "Flagship", price: 589000, originalPrice: 619000, stock: 14, rating: 4.8, reviewCount: 212, popularity: 980, createdAt: "2026-08-12", featured: true, onSale: true,
    colors: [c("Desert Titanium", "#b9a58f"), c("Natural Titanium", "#a7a6a0"), c("Black Titanium", "#2d2e30")], storage: ["256GB", "512GB", "1TB"],
    description: "A large 6.9-inch display, a 48MP camera system with 5x telephoto and the A18 Pro chip in a titanium body.",
    specs: spec("6.9\" LTPO OLED, 120Hz", "Apple A18 Pro", "48MP + 48MP + 12MP", "4685 mAh, 25W wireless", "iOS 18") },
  { id: "galaxy-s25-ultra", name: "Samsung Galaxy S25 Ultra", brand: "Samsung", category: "Flagship", price: 459000, originalPrice: 489000, stock: 22, rating: 4.7, reviewCount: 187, popularity: 910, createdAt: "2026-07-02", featured: true, onSale: true,
    colors: [c("Titanium Silverblue", "#8fa3b8"), c("Titanium Black", "#26282b"), c("Titanium Gray", "#8b8d90")], storage: ["256GB", "512GB", "1TB"],
    description: "A 6.9-inch Dynamic AMOLED screen, built-in S Pen, 200MP main camera and Snapdragon 8 Elite.",
    specs: spec("6.9\" Dynamic AMOLED 2X, 120Hz", "Snapdragon 8 Elite", "200MP + 50MP + 10MP + 50MP", "5000 mAh, 45W", "Android 15, One UI 7") },
  { id: "pixel-9-pro", name: "Google Pixel 9 Pro", brand: "Google", category: "Flagship", price: 339000, stock: 9, rating: 4.6, reviewCount: 96, popularity: 540, createdAt: "2026-06-18", featured: true, onSale: false,
    colors: [c("Porcelain", "#e4dfd6"), c("Obsidian", "#2a2c2f"), c("Hazel", "#8c8f7e")], storage: ["128GB", "256GB", "512GB"],
    description: "Clean Android, a superb camera and seven years of updates, powered by Google Tensor G4.",
    specs: spec("6.3\" LTPO OLED, 120Hz", "Google Tensor G4", "50MP + 48MP + 48MP", "4700 mAh, 37W", "Android 15") },
  { id: "xiaomi-14-ultra", name: "Xiaomi 14 Ultra", brand: "Xiaomi", category: "Flagship", price: 389000, originalPrice: 419000, stock: 6, rating: 4.5, reviewCount: 64, popularity: 410, createdAt: "2026-05-09", featured: false, onSale: true,
    colors: [c("Black", "#1f2022"), c("White", "#ecebe6")], storage: ["512GB", "1TB"],
    description: "A Leica-tuned quad camera with a one-inch main sensor and fast HyperCharge.",
    specs: spec("6.73\" LTPO AMOLED, 120Hz", "Snapdragon 8 Gen 3", "50MP x4 Leica", "5000 mAh, 90W", "Android 14, HyperOS") },
  { id: "galaxy-z-fold6", name: "Samsung Galaxy Z Fold6", brand: "Samsung", category: "Foldable", price: 649000, stock: 4, rating: 4.4, reviewCount: 41, popularity: 220, createdAt: "2026-04-20", featured: false, onSale: false,
    colors: [c("Navy", "#2b3550"), c("Silver Shadow", "#b9bcc2")], storage: ["256GB", "512GB"],
    description: "A 7.6-inch inner display that turns your phone into a tablet.",
    specs: spec("7.6\" inner + 6.3\" cover AMOLED", "Snapdragon 8 Gen 3", "50MP + 12MP + 10MP", "4400 mAh, 25W", "Android 14, One UI 6.1") },
  { id: "oneplus-13", name: "OnePlus 13", brand: "OnePlus", category: "Flagship", price: 279000, stock: 17, rating: 4.6, reviewCount: 73, popularity: 480, createdAt: "2026-08-28", featured: true, onSale: false,
    colors: [c("Midnight Ocean", "#1c2f3a"), c("Arctic Dawn", "#d7dde3")], storage: ["256GB", "512GB"],
    description: "A huge 6000 mAh battery with 100W charging and a Hasselblad-tuned triple camera.",
    specs: spec("6.82\" LTPO AMOLED, 120Hz", "Snapdragon 8 Elite", "50MP x3 Hasselblad", "6000 mAh, 100W", "Android 15, OxygenOS") },
  { id: "galaxy-a56", name: "Samsung Galaxy A56 5G", brand: "Samsung", category: "Mid-range", price: 119000, originalPrice: 129000, stock: 40, rating: 4.3, reviewCount: 130, popularity: 760, createdAt: "2026-09-04", featured: true, onSale: true,
    colors: [c("Awesome Graphite", "#3a3b3f"), c("Awesome Olive", "#8a8f73")], storage: ["128GB", "256GB"],
    description: "A bright AMOLED display and six years of updates at a mid-range price.",
    specs: spec("6.7\" Super AMOLED, 120Hz", "Exynos 1580", "50MP + 12MP + 5MP", "5000 mAh, 45W", "Android 15, One UI 7") },
  { id: "redmi-note-14-pro", name: "Xiaomi Redmi Note 14 Pro+", brand: "Xiaomi", category: "Mid-range", price: 109000, stock: 33, rating: 4.4, reviewCount: 158, popularity: 840, createdAt: "2026-07-22", featured: false, onSale: false,
    colors: [c("Midnight Black", "#222427"), c("Aurora Purple", "#8a7ba8")], storage: ["256GB", "512GB"],
    description: "200MP camera, curved AMOLED and 120W charging.",
    specs: spec("6.67\" AMOLED, 120Hz", "Snapdragon 7s Gen 3", "200MP + 8MP + 2MP", "5110 mAh, 120W", "Android 14, HyperOS") },
  { id: "pixel-8a", name: "Google Pixel 8a", brand: "Google", category: "Mid-range", price: 149000, originalPrice: 169000, stock: 0, rating: 4.4, reviewCount: 88, popularity: 390, createdAt: "2026-03-14", featured: false, onSale: true,
    colors: [c("Bay", "#7fa6c4"), c("Obsidian", "#2a2c2f")], storage: ["128GB", "256GB"],
    description: "Google's camera brains and seven years of updates in a compact body.",
    specs: spec("6.1\" OLED, 120Hz", "Google Tensor G3", "64MP + 13MP", "4492 mAh, 18W", "Android 14") },
  { id: "infinix-hot-50", name: "Infinix Hot 50 Pro+", brand: "Infinix", category: "Budget", price: 54000, stock: 58, rating: 4.1, reviewCount: 201, popularity: 930, createdAt: "2026-06-01", featured: false, onSale: false,
    colors: [c("Sleek Black", "#25262a"), c("Glacier Blue", "#9bb7cc")], storage: ["128GB", "256GB"],
    description: "A slim AMOLED phone with a 108MP camera at an easy price.",
    specs: spec("6.78\" AMOLED, 120Hz", "MediaTek Helio G100", "108MP + 2MP", "5000 mAh, 45W", "Android 14, XOS 14.5") },
  { id: "tecno-spark-30", name: "Tecno Spark 30 Pro", brand: "Tecno", category: "Budget", price: 46000, originalPrice: 52000, stock: 3, rating: 4.0, reviewCount: 117, popularity: 700, createdAt: "2026-05-27", featured: false, onSale: true,
    colors: [c("Orbit Black", "#202124"), c("Aurora Cloud", "#c9d3dc")], storage: ["128GB", "256GB"],
    description: "A 120Hz AMOLED screen and 108MP camera, built for everyday use.",
    specs: spec("6.78\" AMOLED, 120Hz", "MediaTek Helio G100", "108MP + 2MP", "5000 mAh, 33W", "Android 14, HiOS 14") },
  { id: "iphone-15", name: "Apple iPhone 15", brand: "Apple", category: "Mid-range", price: 239000, originalPrice: 259000, stock: 12, rating: 4.6, reviewCount: 244, popularity: 880, createdAt: "2026-02-10", featured: false, onSale: true,
    colors: [c("Blue", "#a9c1d4"), c("Pink", "#e8cdd0"), c("Black", "#2b2c2e")], storage: ["128GB", "256GB"],
    description: "Dynamic Island, a 48MP main camera and USB-C in an aluminium frame.",
    specs: spec("6.1\" Super Retina XDR OLED", "Apple A16 Bionic", "48MP + 12MP", "3349 mAh", "iOS 17") },
];

export const BRANDS = ["Apple", "Samsung", "Google", "Xiaomi", "OnePlus", "Infinix", "Tecno"];

/** Clearly demo-only review content. */
export const DEMO_REVIEWS = [
  { name: "Sample reviewer A", city: "Lahore", rating: 5, text: "Demo review: delivery tracking and packaging felt well thought out." },
  { name: "Sample reviewer B", city: "Karachi", rating: 4, text: "Demo review: the screen is excellent; battery lasts a full day of use." },
  { name: "Sample reviewer C", city: "Islamabad", rating: 5, text: "Demo review: camera quality is a big upgrade over my previous phone." },
];
