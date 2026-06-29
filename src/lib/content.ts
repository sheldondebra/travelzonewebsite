export const contactInfo = {
  address: "#2 Boundary Road, East Legon, Accra",
  phones: ["0244 274 663", "0244 963 557", "0273 332 233"],
  phoneHrefs: ["+233244274663", "+233244963557", "+233273332233"],
  email: "travelzone@yahoo.com",
  hours: "Mon – Fri: 8:30 AM – 5:30 PM · Sat: 9:00 AM – 2:00 PM",
  mapQuery: "Boundary+Road+East+Legon+Accra+Ghana",
};

export const teamMembers = [
  {
    name: "Akosua Oesi",
    role: "CEO",
    image: "/images/team/akosua-oesi.png",
    bio: "Leads Travel Zone with a focus on reliable service, strong airline partnerships, and trips that reflect the best of Ghana and beyond.",
  },
  {
    name: "Ama Adubea Amoah",
    role: "HR & Admin Manager",
    image: "/images/team/ama-adubea-amoah.png",
    bio: "Keeps the office running smoothly — from client records and bookings to the day-to-day support that makes every trip feel organized.",
  },
  {
    name: "Dorinda Darko",
    role: "Senior Travel Consultant",
    image: "/images/team/dorinda-darko.png",
    bio: "Works directly with travelers to build itineraries, compare fares, and find the right package for families, groups, and corporate clients.",
  },
] as const;

export const teamStory = {
  groupImage: "/images/team/travel-zone-team.png",
  groupImageAlt:
    "The Travel Zone team at the East Legon office — Akosua Oesi, Ama Adubea Amoah, and Dorinda Darko",
  paragraphs: [
    "Travel Zone is more than a booking desk — it is a team of people who have spent years helping Ghanaians and visitors travel with confidence. From our office on Boundary Road in East Legon, we handle flights, hotels, insurance, tour packages, and group logistics under one roof.",
    "Whether you are planning a Dubai getaway, a school excursion, or a last-minute business trip, you speak to real consultants who know the routes, the paperwork, and the details that matter. We take time to understand what you need before we recommend anything.",
    "Our team combines leadership, operations, and front-line travel expertise. That is why clients keep coming back — and why walk-ins at our office are always welcome during business hours.",
  ],
} as const;

export const services = [
  {
    slug: "airline-ticketing",
    title: "Airline Ticketing & Reservations",
    description:
      "Domestic and international flights with major carrier partnerships.",
    detail:
      "We book and manage flights across all major airlines, finding the best routes and fares for business trips, family holidays, and group travel. Changes, cancellations, and rebooking are handled by our team so you don't have to call the airline yourself.",
  },
  {
    slug: "travel-insurance",
    title: "Travel Insurance",
    description: "Comprehensive coverage so you travel with peace of mind.",
    detail:
      "Protect your trip against unexpected cancellations, medical emergencies, and lost luggage. We help you choose the right policy for domestic travel, international trips, and adventure tours.",
  },
  {
    slug: "hotel-reservations",
    title: "Hotel Reservations",
    description:
      "Handpicked accommodations from budget stays to luxury resorts.",
    detail:
      "From Accra city hotels to beach resorts and safari lodges, we secure rooms that match your budget and standards — with negotiated rates through our hotel partners.",
  },
  {
    slug: "car-rentals",
    title: "Car Rentals",
    description:
      "Reliable vehicles for self-drive or chauffeured ground transport.",
    detail:
      "Need a sedan for a business meeting or a minibus for a group tour? We arrange self-drive rentals and chauffeured transport with vetted drivers who know Ghana's roads.",
  },
  {
    slug: "group-travel",
    title: "Group Travel Arrangement",
    description:
      "Coordinated logistics for schools, churches, and large parties.",
    detail:
      "We specialize in moving groups of 10 to 500+ people. Our team handles buses, meals, accommodation blocks, permits, and on-ground coordination so your group travels as one unit.",
  },
  {
    slug: "tour-packages",
    title: "Tour Packages",
    description: "Ready-made and custom itineraries across Ghana and abroad.",
    detail:
      "Choose from our popular Ghana tour packages or tell us your dream itinerary. We build day-by-day plans covering transport, guides, entry fees, and meals.",
  },
  {
    slug: "adventure-tours",
    title: "Organized Adventure Tours",
    description:
      "Guided outdoor experiences from canopy walks to safari drives.",
    detail:
      "Kayaking, hiking, canopy walks, wildlife safaris, and cultural festival tours — all led by experienced local guides with safety equipment and logistics included.",
  },
  {
    slug: "corporate-travel",
    title: "Corporate Travels",
    description: "Business travel management for companies and organizations.",
    detail:
      "Dedicated account management for companies that travel frequently. We handle flight bookings, hotel contracts, visa support, and expense reporting for your team.",
  },
];

export const audiences = [
  {
    title: "Individuals & Families",
    description:
      "Personal getaways, honeymoons, and family holidays planned around your schedule and budget.",
  },
  {
    title: "Schools & Universities",
    description:
      "Educational excursions with safe transport, licensed guides, and curriculum-aligned itineraries.",
  },
  {
    title: "Churches & Community Groups",
    description:
      "Group pilgrimages, retreats, and fellowship trips with full logistics support.",
  },
  {
    title: "Corporate Organizations",
    description:
      "Business travel, conferences, team-building retreats, and incentive trips for staff.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Tell Us Your Plans",
    description:
      "Share your destination, dates, group size, and budget — in person, by phone, or through our contact form.",
  },
  {
    step: "02",
    title: "We Build Your Itinerary",
    description:
      "Our team crafts a personalized plan with transport, accommodation, activities, and a clear cost breakdown.",
  },
  {
    step: "03",
    title: "Confirm & Book",
    description:
      "Once you approve, we handle all bookings — flights, hotels, permits, and ground transport.",
  },
  {
    step: "04",
    title: "Travel with Support",
    description:
      "Enjoy your trip with 24/7 on-ground assistance from our team and local partners.",
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  bodyHtml?: string;
  image: string;
  date: string;
  category: string;
  readTime: string;
  updatedAt?: string;
};

export {
  getPublishedBlogPosts,
  getBlogPostBySlug,
} from "@/lib/content-public";

/** Static fallback for sitemap and seed script */
export { staticBlogPosts as blogPosts } from "@/lib/seed-data";
