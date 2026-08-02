// Populates the database with demo artisans + one customer + one artisan
// login, so the app has something to show right after setup.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('./config/db');
const { User, Artisan } = require('./models');

const ARTISANS = [
  { name: "Marcus Odum", trade: "Plumbing", state: "Rivers", city: "Port Harcourt", area: "Trans-Amadi", yearsExp: 14, priceRange: "₦8,000–25,000", phone: "+234 803 214 5590", bio: "Leak repairs, borehole pump installation, and full bathroom re-piping. Available for emergency call-outs.", verified: true, ratingAvg: 4.8, reviewCount: 63 },
  { name: "Amaka Chukwu", trade: "Electrical", state: "Rivers", city: "Port Harcourt", area: "GRA Phase 2", yearsExp: 9, priceRange: "₦10,000–40,000", phone: "+234 807 662 1183", bio: "Certified electrician handling rewiring, inverter setup, and fault diagnosis for homes and small offices.", verified: true, ratingAvg: 4.9, reviewCount: 41 },
  { name: "Tunde Bassey", trade: "Carpentry", state: "Rivers", city: "Port Harcourt", area: "Rumuola", yearsExp: 20, priceRange: "₦15,000–90,000", phone: "+234 806 447 2091", bio: "Custom furniture, built-in wardrobes, and door/window frame repair.", verified: true, ratingAvg: 4.7, reviewCount: 88 },
  { name: "Grace Ibe", trade: "Painting", state: "Rivers", city: "Port Harcourt", area: "Woji", yearsExp: 6, priceRange: "₦5,000–20,000/room", phone: "+234 815 903 4477", bio: "Interior and exterior painting, texture finishes, and small drywall patch-ups.", verified: false, ratingAvg: 4.6, reviewCount: 27 },
  { name: "Emeka Nwosu", trade: "Masonry", state: "Rivers", city: "Port Harcourt", area: "Eliozu", yearsExp: 17, priceRange: "₦20,000–120,000", phone: "+234 802 331 7765", bio: "Block work, fence walls, and foundation repair. Brings his own crew for larger jobs.", verified: true, ratingAvg: 4.5, reviewCount: 34 },
  { name: "Ibrahim Musa", trade: "Welding", state: "Kano", city: "Kano", area: "Sabon Gari", yearsExp: 11, priceRange: "₦6,000–35,000", phone: "+234 810 552 8834", bio: "Gates, burglary-proof windows, and steel staircase fabrication.", verified: false, ratingAvg: 4.4, reviewCount: 19 },
  { name: "Chidinma Okoro", trade: "Roofing", state: "Rivers", city: "Port Harcourt", area: "Rumuokwuta", yearsExp: 13, priceRange: "₦25,000–150,000", phone: "+234 809 118 6620", bio: "Long-span roofing sheets, leak diagnosis, and gutter installation.", verified: true, ratingAvg: 4.7, reviewCount: 52 },
  { name: "Samuel Etim", trade: "Landscaping", state: "Rivers", city: "Port Harcourt", area: "Old GRA", yearsExp: 8, priceRange: "₦12,000–60,000", phone: "+234 813 774 2298", bio: "Lawn design, hedge shaping, and irrigation for residential compounds.", verified: false, ratingAvg: 4.3, reviewCount: 15 },
  { name: "Tayo Alabi", trade: "Plumbing", state: "Lagos", city: "Ikeja", area: "Allen Avenue", yearsExp: 10, priceRange: "₦10,000–30,000", phone: "+234 812 400 1122", bio: "Pipe fitting, water heater installation, and drainage system repair across Lagos mainland.", verified: true, ratingAvg: 4.6, reviewCount: 22 },
  { name: "Funke Adeyemi", trade: "Electrical", state: "Lagos", city: "Lekki", area: "Phase 1", yearsExp: 7, priceRange: "₦15,000–45,000", phone: "+234 815 233 9087", bio: "Smart home wiring, solar inverter setup, and generator changeover installation.", verified: false, ratingAvg: 4.5, reviewCount: 12 },
];

async function seed() {
  await sequelize.sync();

  const existing = await Artisan.count();
  if (existing > 0) {
    console.log(`Already have ${existing} artisans — skipping seed.`);
    return process.exit(0);
  }

  const demoPasswordHash = await bcrypt.hash('password123', 12);

  // A sample customer account you can log in with immediately.
  await User.findOrCreate({
    where: { email: 'customer@demo.com' },
    defaults: { name: 'Demo Customer', email: 'customer@demo.com', phone: '+234 800 000 0000', passwordHash: demoPasswordHash, role: 'customer', emailVerified: true },
  });

  for (const a of ARTISANS) {
    const email = a.name.toLowerCase().replace(/\s+/g, '.') + '@demo.com';
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: { name: a.name, email, phone: a.phone, passwordHash: demoPasswordHash, role: 'artisan', emailVerified: true },
    });
    await Artisan.findOrCreate({
      where: { userId: user.id },
      defaults: { ...a, userId: user.id },
    });
  }

  console.log(`Seeded ${ARTISANS.length} artisans + 1 demo customer.`);
  console.log('Every seeded account logs in with password: password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
