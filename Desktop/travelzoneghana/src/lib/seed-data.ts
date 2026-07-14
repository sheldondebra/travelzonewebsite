import type { BlogPost } from "@/lib/content";
import type { Tour } from "@/lib/tours";

export const staticTours: Tour[] = [
  {
    slug: "dubai-summer-getaway",
    title: "Dubai Summer Getaway",
    tagline: "Make This Summer All About Dubai",
    location: "Dubai, United Arab Emirates",
    duration: "4 Nights / 5 Days",
    price: 1500,
    currency: "USD",
    priceNote: "per person (double sharing)",
    travelPeriod: "June – August",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      "https://images.unsplash.com/photo-1582672060016-769a9fb3a48b?w=800&q=80",
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    ],
    description:
      "A 4-night Dubai escape with iconic sights, desert adventures, and complete comfort — visa, breakfast, tours, and transfers included.",
    overview: [
      "Turn your summer into a memorable escape with a 4 Nights / 5 Days Dubai getaway filled with iconic sights, exciting experiences, and complete comfort. From stunning city skylines to thrilling desert adventures, every moment is designed for you to relax and enjoy.",
      "Let everything be taken care of while you explore, unwind, and create unforgettable memories in one of the world's most vibrant destinations.",
    ],
    highlights: [
      "Dubai city tour (shared basis)",
      "Marina dhow cruise (shared basis)",
      "Desert safari with BBQ dinner (shared basis)",
      "Return airport transfers",
      "Meet & greet and hotel check-in assistance",
    ],
    included: [
      "4 nights accommodation",
      "UAE visa processing",
      "Daily breakfast",
      "Tourism Dirham fee included",
      "Return airport transfers",
      "Marina dhow cruise — SIC",
      "Dubai city tour — SIC",
      "Desert safari with BBQ dinner — SIC",
      "Meet & greet assistance",
      "Hotel check-in assistance",
      "Welcome kit",
    ],
    category: "International",
  },
];

export const staticBlogPosts: BlogPost[] = [
  {
    slug: "cape-coast-castles-guide",
    title: "A Visitor's Guide to Cape Coast & Elmina Castles",
    excerpt:
      "Everything you need to know before visiting Ghana's most significant historical landmarks — from what to wear to how to make the most of your tour.",
    content: [
      "The Cape Coast and Elmina Castles are among the most powerful historical sites in West Africa. A visit here is not a casual sightseeing stop — it's a journey into Ghana's past that stays with you long after you leave.",
      "Plan to spend at least half a day at each castle. Guided tours are essential; the stories behind the dungeons, the Door of No Return, and the governor's chambers come alive through a knowledgeable guide. TravelZone includes licensed guides in all our Cape Coast tour packages.",
      "Wear comfortable shoes and light clothing — the stone corridors can be warm. Bring water, sunscreen, and a respectful mindset. Photography is allowed in most areas, but some sections may have restrictions.",
      "The best time to visit is early morning on weekdays when crowds are thinner. We recommend combining a castle visit with a stop at Kakum National Park for a full day of history and nature.",
    ],
    image: "/images/blog/cape-coast-castle.jpg",
    date: "March 12, 2026",
    category: "Ghana Travel",
    readTime: "6 min read",
  },
  {
    slug: "kakum-canopy-walkway-tips",
    title: "What to Expect at Kakum Canopy Walkway",
    excerpt:
      "Ghana's famous rainforest canopy walk is a must-do — here's how to prepare, what to bring, and the best time to go.",
    content: [
      "Suspended 30 metres above the forest floor, the Kakum Canopy Walkway is one of the longest of its kind in Africa. The seven bridges connect ancient trees and offer views of the rainforest canopy that few visitors ever see.",
      "The walk takes about 45 minutes to an hour. It's suitable for most fitness levels, though anyone with a fear of heights should know the bridges do sway slightly. Hold the handrails and take your time — the views are worth it.",
      "Wear closed-toe shoes with good grip. The park opens at 8 AM; arriving early means fewer people on the bridges and better wildlife spotting. You may see hornbills, mona monkeys, and colourful butterflies.",
      "TravelZone's Kakum day trips from Accra include transport, park entry, a guided canopy walk, and an optional stop at Hans Cottage for crocodile viewing nearby.",
    ],
    image: "/images/blog/kakum-canopy-walkway.jpg",
    date: "February 28, 2026",
    category: "Adventure",
    readTime: "5 min read",
  },
  {
    slug: "mole-national-park-safari",
    title: "Planning a Safari at Mole National Park",
    excerpt:
      "Ghana's largest wildlife park is home to elephants, antelope, and over 300 bird species. Here's how to plan the perfect safari trip.",
    content: [
      "Mole National Park in the Northern Region is Ghana's premier wildlife destination. Unlike East African safaris, Mole offers an intimate experience where elephants often come within metres of the viewing platform at the park headquarters.",
      "The dry season (November to March) is the best time for wildlife viewing — animals congregate around water sources and vegetation is thinner, making sightings easier. The park offers walking safaris and vehicle tours, both led by armed rangers.",
      "Accommodation ranges from the Zaina Lodge (luxury) to the park's own motel (budget-friendly). We recommend at least two nights to fully experience morning and evening game drives.",
      "Getting to Mole from Accra is a long drive (about 10 hours), so most TravelZone packages include a flight to Tamale followed by a scenic road transfer. We handle all logistics including park fees, guides, and meals.",
    ],
    image: "/images/blog/mole-national-park.jpg",
    date: "February 14, 2026",
    category: "Wildlife",
    readTime: "7 min read",
  },
  {
    slug: "wli-waterfalls-hiking-guide",
    title: "Hiking to Wli Waterfalls: Ghana's Tallest Cascade",
    excerpt:
      "A complete guide to reaching West Africa's highest waterfall — trail details, what to pack, and the best season to visit.",
    content: [
      "Wli Waterfalls (Agumatsa Falls) in the Volta Region drops over 60 metres in two stages — upper and lower falls — surrounded by lush tropical forest. It's one of the most rewarding day hikes in Ghana.",
      "The lower falls trail is an easy 45-minute walk suitable for all ages. The upper falls trail is more challenging, taking about 2–3 hours round trip through steeper terrain. Both require a local guide, which is included in TravelZone packages.",
      "Visit during or just after the rainy season (May–October) when the falls are at their most spectacular. During dry months the flow reduces but the hike and swimming pool at the base remain enjoyable.",
      "Pack swimwear, water shoes, insect repellent, and a change of clothes. The pool at the base of the lower falls is perfect for a refreshing dip after the hike.",
    ],
    image: "/images/blog/wli-waterfalls.jpg",
    date: "January 30, 2026",
    category: "Adventure",
    readTime: "5 min read",
  },
  {
    slug: "nzulezu-stilt-village-guide",
    title: "Visiting Nzulezu: Ghana's Iconic Stilt Village",
    excerpt:
      "How to reach the lake village built on stilts in the Western Region — boat rides, cultural etiquette, and the best time to go.",
    content: [
      "Nzulezu (often written Nzulezo) sits on Lake Tadane in the Western Region, with homes, a school, and daily life all built above the water on wooden stilts. It is one of Ghana's most unusual and photogenic destinations.",
      "Access is by canoe from Beyin — the ride takes about an hour through mangrove channels before the village comes into view. Licensed local guides are required; TravelZone arranges transport from Takoradi or Accra with guide and community fees included.",
      "Respect community rules: ask before photographing people, dress modestly, and follow your guide's instructions around homes and the school. Most visits last half a day; combine with Busua or Axim beach for a full Western Region itinerary.",
      "The dry season (November–March) offers calmer lake conditions. Bring sun protection, insect repellent, and a waterproof bag for the canoe ride.",
    ],
    image: "/images/blog/nzulezu-stilt-village.jpg",
    date: "April 5, 2026",
    category: "Ghana Travel",
    readTime: "6 min read",
  },
  {
    slug: "shai-hills-day-trip",
    title: "Shai Hills: Wildlife and History Near Accra",
    excerpt:
      "Baboons, cave temples, and savannah hikes less than an hour from the capital — perfect for a half-day or school excursion.",
    content: [
      "Shai Hills Resource Reserve lies in the Shai-Osudoku District, roughly 50 km north-east of Accra. It combines open savannah, rocky outcrops, and cultural sites in a compact area that's easy to reach on a day trip.",
      "Olive baboons are the reserve's most famous residents — they often appear near the entrance and along the main tracks. Keep food sealed and follow ranger advice; they are wild animals despite their confidence around visitors.",
      "Hiking trails lead to cave shelters once used for traditional rites, with interpretive stops along the way. Early morning visits offer cooler temperatures and better wildlife activity before the midday heat.",
      "TravelZone runs Shai Hills day trips from Accra with park fees, a ranger guide, and optional extensions to the Akosombo road or Aburi for a full day out of the city.",
    ],
    image: "/images/blog/shai-hills.jpg",
    date: "April 18, 2026",
    category: "Wildlife",
    readTime: "5 min read",
  },
  {
    slug: "boti-falls-eastern-region",
    title: "Boti Falls: Twin Cascades in the Eastern Region",
    excerpt:
      "A straightforward guide to upper and lower Boti Falls, seasonal flow, and pairing your visit with the umbrella rock nearby.",
    content: [
      "Boti Falls near Huhunya in the Eastern Region is known for its twin cascades — the upper and lower falls — which local legend describes as male and female. When water levels are high, the two streams merge in a spectacular display.",
      "The lower falls are a short walk from the visitor centre; the upper falls require a longer hike with steps. Rainy season (May–July) brings the strongest flow, while dry months still offer a pleasant forest walk and picnic spots.",
      "Nearby umbrella rock is a popular add-on — a natural rock formation balanced over a clearing with views across the hills. Allow 3–4 hours on site including photos and rest time.",
      "TravelZone packages from Accra include transport, entry fees, and a guide. Wear grippy shoes; paths can be slippery after rain.",
    ],
    image: "/images/blog/boti-falls.jpg",
    date: "May 2, 2026",
    category: "Adventure",
    readTime: "5 min read",
  },
  {
    slug: "kwame-nkrumah-mausoleum-accra",
    title: "Kwame Nkrumah Mausoleum & Memorial Park",
    excerpt:
      "Accra's landmark memorial to Ghana's first president — what to see, opening hours, and how to combine it with a city tour.",
    content: [
      "The Kwame Nkrumah Mausoleum sits on the old Polo Grounds in central Accra, where Ghana's independence was declared in 1957. The mausoleum holds Dr Nkrumah's remains; the surrounding memorial park includes statues, fountains, and a museum of his life and pan-African legacy.",
      "Plan 1–2 hours for the museum exhibits and grounds. Photography is allowed in most outdoor areas; check current rules for the mausoleum interior. The site is walking distance from Independence Arch and Black Star Square — ideal for a half-day Accra heritage walk.",
      "Weekday mornings are quietest. The park is fully paved and suitable for visitors of all ages; bring water and a hat — shade is limited on the main plaza.",
      "TravelZone includes the mausoleum on Accra city tours and school programmes focused on Ghanaian history and civics.",
    ],
    image: "/images/blog/kwame-nkrumah-mausoleum.jpg",
    date: "May 16, 2026",
    category: "Ghana Travel",
    readTime: "4 min read",
  },
  {
    slug: "paga-crocodile-pond-experience",
    title: "Paga Crocodile Pond: Sacred Reptiles of the Upper East",
    excerpt:
      "Meet the friendly crocodiles of Paga — cultural significance, safety tips, and how to fit a visit into a northern Ghana route.",
    content: [
      "In Paga, near Ghana's border with Burkina Faso, sacred crocodiles have lived alongside the community for generations. Under guide supervision, visitors can approach — and in some ponds, briefly touch — crocodiles considered protectors of the town.",
      "This is not a zoo experience; the ponds are community-managed cultural sites with strict rules. Always use an official guide, never approach alone, and follow instructions on where to stand and whether flash photography is permitted.",
      "Paga pairs naturally with Bolgatanga market crafts, the Pikworo slave camp, and routes toward Mole National Park or Paga's border crossing. Most visitors spend 30–60 minutes at the pond itself.",
      "TravelZone northern itineraries can include Paga with overnight stops in Bolga or Tamale, handling permits, guide fees, and road transfers.",
    ],
    image: "/images/blog/paga-crocodile-pond.jpg",
    date: "May 30, 2026",
    category: "Ghana Travel",
    readTime: "5 min read",
  },
  {
    slug: "aburi-botanical-gardens-escape",
    title: "Aburi Botanical Gardens: A Cool Escape from Accra",
    excerpt:
      "Colonial-era plantings, palm avenues, and picnic lawns in the Akwapim Hills — an easy half-day trip from the capital.",
    content: [
      "Aburi Botanical Gardens was established in 1890 in the cooler Akwapim Hills, about 30 km north of Accra. Shaded paths, towering palms, and open lawns make it a favourite for families, picnics, and weekend retreats from the city heat.",
      "Highlights include the wide allee of royal palms, historic superintendent's bungalow, and seasonal flowering beds. The gardens are compact — allow 1–2 hours for a relaxed walk, longer if you're picnicking or photographing.",
      "Combine Aburi with a craft stop at Akosua's basket village, a viewpoint drive along the ridge, or lunch at one of the hill-top restaurants overlooking Accra's sprawl on clear days.",
      "TravelZone runs Aburi half-day and full-day trips with entry fees and optional lunch reservations. Weekends are busier; weekday mornings are calmest.",
    ],
    image: "/images/blog/aburi-botanical-gardens.jpg",
    date: "June 8, 2026",
    category: "Ghana Travel",
    readTime: "4 min read",
  },
  {
    slug: "akosombo-dam-lake-volta",
    title: "Akosombo Dam & Lake Volta: Ghana's Inland Sea",
    excerpt:
      "Boat cruises, dam viewpoints, and lakeside resorts on one of the world's largest artificial lakes.",
    content: [
      "Lake Volta was created when the Akosombo Dam impounded the Volta River in the 1960s. Today it stretches hundreds of kilometres inland — an inland sea that powers much of Ghana and supports fishing, ferries, and lakeside tourism.",
      "The dam viewpoint at Akosombo town explains the scale of the project; when spillway gates open in high-water years, the flow is an event in itself. Lake cruises range from short afternoon trips to multi-day houseboat charters.",
      "Popular bases include Akosombo, Atimpoku, and riverside lodges along the Adome bridge route from Accra. Activities include birdwatching, fishing villages, and Dodi Island cruises with live music on some departures.",
      "TravelZone books lake cruises, dam tours, and overnight packages with transport from Accra — ideal for couples, families, and corporate retreats.",
    ],
    image: "/images/blog/akosombo-dam.jpg",
    date: "June 14, 2026",
    category: "Ghana Travel",
    readTime: "6 min read",
  },
  {
    slug: "larabanga-mosque-visit",
    title: "Larabanga Mosque: Ghana's Oldest Mud-Walled Mosque",
    excerpt:
      "A stop at the historic Sahelian mosque near Mole — dress codes, photography, and combining with a wildlife safari.",
    content: [
      "Larabanga's ancient mosque, built from mud and reeds in the Sahelian style, is one of the oldest mosques in West Africa and a landmark on routes to Mole National Park. Its whitewashed towers rise abruptly from the savannah edge.",
      "Non-Muslim visitors may view the exterior; interior access is restricted and varies by season and imam. Dress conservatively, remove shoes if invited closer, and ask before photographing worshippers or during prayer times.",
      "Most TravelZone Mole safari packages include a brief Larabanga stop en route — typically 20–30 minutes for photos and local history from your guide. Combine with the nearby mystery stone legend if time allows.",
      "The best light for photography is early morning or late afternoon when the mud walls glow warm against the northern sky.",
    ],
    image: "/images/blog/larabanga-mosque.jpg",
    date: "June 20, 2026",
    category: "Ghana Travel",
    readTime: "4 min read",
  },
  {
    slug: "busua-beach-weekend",
    title: "Busua Beach: Surf, Seafood, and Slow Weekends",
    excerpt:
      "Ghana's favourite surf village on the Western coast — where to stay, what to eat, and how to get there from Accra or Takoradi.",
    content: [
      "Busua is a laid-back fishing and surf community in the Western Region, about 30 km from Takoradi. Atlantic swells, beach bars, and fresh lobster dinners draw weekending Accra crowds and backpackers alike.",
      "Surfboard hire and lessons are available on the main beach; beginners find forgiving breaks in the shallow sections while experienced surfers head to outer peaks. Even non-surfers enjoy long beach walks and canoe landings at dawn.",
      "Stay one or two nights to catch sunset and morning fish straight off the boats. Pair Busua with Nzulezu, Axim Fort, or Fort Metal Cross for a full Western Region loop.",
      "TravelZone arranges Busua weekend packages with beachfront lodging, return transport, and optional surf lessons — popular for groups and honeymoons.",
    ],
    image: "/images/blog/busua-beach.jpg",
    date: "June 26, 2026",
    category: "Adventure",
    readTime: "5 min read",
  },
  {
    slug: "elmina-castle-visitor-guide",
    title: "Elmina Castle: Ghana's Oldest European Fort",
    excerpt:
      "History, tours, and practical tips for visiting St George's Castle at Elmina — companion to any Cape Coast heritage trip.",
    content: [
      "Elmina Castle (St George's Castle), built by the Portuguese in 1482, predates Cape Coast Castle and was later controlled by the Dutch. It sits on a dramatic promontory above Elmina's busy fishing harbour — one of the most photographed sites in Ghana.",
      "Guided tours cover the governor's quarters, female dungeons, male dungeons, and the Door of No Return facing the Atlantic. The contrast between the castle's coastal beauty and its history makes guided interpretation essential.",
      "Allow 2–3 hours including the museum sections and harbour viewpoints. Elmina's fish market below the castle is worth a short walk — vibrant, loud, and best visited with a guide who knows local etiquette.",
      "TravelZone heritage tours combine Elmina and Cape Coast castles in one day with a licensed historian guide, lunch, and transport from Accra or Cape Coast.",
    ],
    image: "/images/blog/elmina-castle.jpg",
    date: "June 28, 2026",
    category: "Ghana Travel",
    readTime: "6 min read",
  },
  {
    slug: "school-excursion-planning",
    title: "Why Group Tours Work Best for School Excursions",
    excerpt:
      "Safety, logistics, and learning outcomes — how professional tour management makes educational trips smoother for schools and parents.",
    content: [
      "Organizing a school trip involves far more than booking a bus. Permits, insurance, meal planning, emergency contacts, and age-appropriate itineraries all need to come together — and that's where a professional travel company makes the difference.",
      "TravelZone has managed excursions for dozens of schools across Ghana. We provide GPS-tracked buses, licensed tour guides who can tie visits to curriculum topics, and a dedicated coordinator who stays with the group throughout the trip.",
      "Parents appreciate the transparency: detailed itineraries sent in advance, real-time updates during the trip, and comprehensive insurance coverage. Schools appreciate the single point of contact for all logistics.",
      "Popular school excursion destinations include Kakum, Cape Coast, Shai Hills, Aburi Botanical Gardens, and the Kwame Nkrumah Mausoleum. We customize each trip based on the age group and learning objectives.",
    ],
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    date: "January 15, 2026",
    category: "Group Travel",
    readTime: "4 min read",
  },
  {
    slug: "corporate-travel-ghana-tips",
    title: "Corporate Travel Tips for Ghanaian Businesses",
    excerpt:
      "How to streamline business travel for your team — from flight policies to hotel contracts and expense management.",
    content: [
      "For companies that send staff on regular business trips, managing travel in-house is time-consuming and often more expensive than using a dedicated travel management partner.",
      "TravelZone's corporate travel service gives your company a single account manager, negotiated hotel rates, priority rebooking during disruptions, and monthly expense reports. Your team books through us; we handle the rest.",
      "Key tips: establish a clear travel policy (class of flight, hotel tier, advance booking window), consolidate bookings through one agency for better rates, and always include travel insurance for international trips.",
      "We currently serve corporate clients in banking, mining, NGOs, and government agencies. Contact us for a custom corporate travel proposal tailored to your organization's needs.",
    ],
    image:
      "https://images.unsplash.com/photo-1523800503107-5bc3ce2a3a7d?w=800&q=80",
    date: "December 20, 2025",
    category: "Corporate",
    readTime: "5 min read",
  },
];

export function paragraphsToHtml(paragraphs: string[]) {
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}
