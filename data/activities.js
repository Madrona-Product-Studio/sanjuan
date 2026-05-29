/**
 * San Juan Islands Discovery Guide — Activities Data
 * Dining, Trails, Art/Galleries, Wellness, Cycling
 */

const DINING = [
  // San Juan Island — Friday Harbor
  { id: "downriggers", name: "Downriggers Restaurant", island: "san-juan", area: "Friday Harbor", lat: 48.535, lng: -123.017, cuisine: "Pacific NW Seafood", price: "$$", walkFromDock: "0.1 mi", hours: "11 AM - 8:30 PM daily", description: "Waterfront views steps from the marina, Pacific Northwest seafood." },
  { id: "coho", name: "Coho Restaurant", island: "san-juan", area: "Friday Harbor", lat: 48.535, lng: -123.015, cuisine: "Fine Dining / Farm-to-Fork", price: "$$$", walkFromDock: "0.2 mi", hours: null, description: "Wine Spectator Award of Excellence for 20+ years. Intimate candlelit four-course tasting menus." },
  { id: "cask-schooner", name: "Cask & Schooner Public House", island: "san-juan", area: "Friday Harbor", lat: 48.536, lng: -123.016, cuisine: "English Pub", price: "$$", walkFromDock: "0.1 mi", hours: null, description: "Hand-battered fish and chips and craft cocktails. 1 Front Street North." },
  { id: "rocky-bay", name: "Rocky Bay Cafe", island: "san-juan", area: "Friday Harbor", lat: 48.535, lng: -123.014, cuisine: "Breakfast/Cafe", price: "$", walkFromDock: "0.1 mi", hours: "Morning", description: "Two-minute walk from the marina. Morning fuel stop." },
  { id: "duck-soup", name: "Duck Soup Inn", island: "san-juan", area: "Friday Harbor (4mi north)", lat: 48.575, lng: -123.04, cuisine: "Farm/Foraged NW", price: "$$$", walkFromDock: "4 mi (transport needed)", hours: null, description: "Rustic cabin setting. Nearly all ingredients sourced or foraged from the island. Acclaimed by Bon Appetit and Fodor's across 40+ years." },
  // San Juan Island — Roche Harbor
  { id: "mcmillins", name: "McMillin's Dining Room", island: "san-juan", area: "Roche Harbor", lat: 48.610, lng: -123.154, cuisine: "Fine Dining", price: "$$$", walkFromDock: "0.1 mi", hours: "Thu-Mon 4-9 PM", description: "In the founder's former home. 60-day aged prime rib, Wine Spectator wines." },
  { id: "madrona", name: "Madrona Bar & Grill", island: "san-juan", area: "Roche Harbor", lat: 48.610, lng: -123.153, cuisine: "Waterfront Dining", price: "$$", walkFromDock: "0.1 mi", hours: "Summer seasonal", description: "Only sunset-over-water dining on the island. Deck built directly over the harbor." },
  { id: "lime-kiln-cafe", name: "Lime Kiln Cafe", island: "san-juan", area: "Roche Harbor", lat: 48.610, lng: -123.155, cuisine: "Breakfast/Bakery", price: "$", walkFromDock: "0.1 mi", hours: "Morning", description: "Fresh doughnuts and hearty breakfasts on the wharf." },
  { id: "westcott-bay", name: "Westcott Bay Shellfish Co.", island: "san-juan", area: "Roche Harbor (1mi)", lat: 48.605, lng: -123.16, cuisine: "Oyster Bar", price: "$$", walkFromDock: "1 mi", hours: "May-Oct, reservation-based 1.5-hr seatings", description: "Eat oysters where they grow at beachside picnic tables overlooking cultivated tidelands.", producer: true, seasonalNotes: "May through October only" },

  // Orcas Island — Deer Harbor
  { id: "deer-dock-store", name: "Marina Dock Store", island: "orcas", area: "Deer Harbor", lat: 48.623, lng: -122.999, cuisine: "Casual / Dockside", price: "$", walkFromDock: "at dock", hours: null, description: "Espresso, burgers, fish and chips, pizza right at the marina." },
  { id: "island-pie", name: "Island Pie", island: "orcas", area: "Deer Harbor", lat: 48.622, lng: -122.998, cuisine: "Pizza", price: "$", walkFromDock: "short walk", hours: null, description: "Wood-fired pizza near Deer Harbor Marina." },
  // Orcas Island — Eastsound
  { id: "matia-kitchen", name: "Matia Kitchen & Bar", island: "orcas", area: "Eastsound", lat: 48.693, lng: -122.907, cuisine: "Seasonal Tasting Menu", price: "$$$", walkFromDock: "drive/shuttle", hours: "Reservations essential", description: "James Beard Award nomination 2024. Hyper-local seasonal tasting menus." },
  { id: "houlme", name: "Houlme", island: "orcas", area: "Eastsound", lat: 48.693, lng: -122.906, cuisine: "Pizza / Seafood", price: "$$", walkFromDock: "drive/shuttle", hours: "Closed Mon/Tue", description: "Seven James Beard nominations. Creative sourdough pizza and seafood small plates." },
  { id: "new-leaf", name: "New Leaf Cafe", island: "orcas", area: "Eastsound", lat: 48.694, lng: -122.908, cuisine: "Pacific NW", price: "$$", walkFromDock: "drive/shuttle", hours: null, description: "Inside the historic Outlook Inn. Water-view dining with crab cakes and wild salmon." },
  { id: "brown-bear", name: "Brown Bear Baking", island: "orcas", area: "Eastsound", lat: 48.694, lng: -122.907, cuisine: "Bakery/Coffee", price: "$", walkFromDock: "drive/shuttle", hours: "Morning", description: "Morning essential. Artisanal bread, almond croissants, espresso with bay views." },
  { id: "mijitas", name: "Mijitas Mexican Kitchen", island: "orcas", area: "Eastsound", lat: 48.693, lng: -122.908, cuisine: "Mexican", price: "$", walkFromDock: "drive/shuttle", hours: null, description: "Carnitas tacos and margaritas on an outdoor patio." },
  // Orcas — Rosario/Olga
  { id: "cascade-grill", name: "Cascade Bay Grill & Store", island: "orcas", area: "Rosario", lat: 48.646, lng: -122.875, cuisine: "Casual", price: "$", walkFromDock: "at marina", hours: "Summer seasonal", description: "Pizza, burgers, and waterside outdoor dining at the marina." },
  { id: "buck-bay", name: "Buck Bay Shellfish Farm", island: "orcas", area: "Olga", lat: 48.635, lng: -122.855, cuisine: "Oyster Bar", price: "$$", walkFromDock: "2.5 mi from Rosario", hours: null, description: "Ultra-fresh shucked oysters at picnic tables on a working farm.", producer: true },
  { id: "olga-rising", name: "Olga Rising", island: "orcas", area: "Eastsound", lat: 48.694, lng: -122.907, cuisine: "Breakfast / Sandwiches", price: "$", walkFromDock: "drive/shuttle", hours: null, description: "Buttermilk biscuit sandwiches, curry chicken sandwich, boysenberry lemonade, and cinnamon rolls." },
  { id: "doe-bay-wine", name: "Doe Bay Wine Company", island: "orcas", area: "Eastsound", lat: 48.694, lng: -122.906, cuisine: "Wine Tasting", price: "$$", walkFromDock: "drive/shuttle", hours: null, description: "Prosser-sourced wines in a tasting room. Spanish potato chips and resident chihuahua Arthur.", producer: true },
  { id: "the-madrona-orcas", name: "The Madrona", island: "orcas", area: "Eastsound", lat: 48.693, lng: -122.907, cuisine: "American / Seafood", price: "$$", walkFromDock: "drive/shuttle", hours: null, description: "Sandwiches, burgers, and seafood in the historic Porter Building in Eastsound." },

  // San Juan Island — Roche Harbor area (additional)
  { id: "sji-distillery", name: "San Juan Island Distillery & Westcott Bay Cider", island: "san-juan", area: "Roche Harbor (1mi)", lat: 48.604, lng: -123.158, cuisine: "Distillery / Cidery", price: "$$", walkFromDock: "1 mi", hours: "Saturdays 1-4 PM; cidery Thu-Sun in summer", description: "Shared tasting barn on Anderson Lane. Apple brandy judged best craft-distilled in the U.S. Spy Hop Gin (silver medals). Westcott Bay Cider from 1,300+ English and French cider apple trees replanted on an 1870s orchard.", producer: true, seasonalNotes: "Saturdays year-round; cidery expanded hours in summer" },

  // Lopez Island
  { id: "haven", name: "HAVEN Kitchen & Bar", island: "lopez", area: "Lopez Village", lat: 48.515, lng: -122.900, cuisine: "Pacific NW", price: "$$", walkFromDock: "1 mi", hours: null, description: "Upscale Pacific Northwest cuisine with waterfront views." },
  { id: "ursa-minor", name: "Ursa Minor", island: "lopez", area: "Lopez Village", lat: 48.515, lng: -122.901, cuisine: "Agrarian Fine Dining", price: "$$$", walkFromDock: "1 mi", hours: null, description: "Creative agrarian fine dining with local seasonal ingredients." },
  { id: "setsunai", name: "Setsunai", island: "lopez", area: "Lopez Village", lat: 48.515, lng: -122.899, cuisine: "Asian-Inspired", price: "$$", walkFromDock: "1 mi", hours: null, description: "Asian-inspired dishes with revolving seasonal menus." },
  { id: "islander-grill", name: "Islander Bar & Grill", island: "lopez", area: "Lopez Islander Resort", lat: 48.513, lng: -122.913, cuisine: "American", price: "$$", walkFromDock: "at marina", hours: "Breakfast through dinner", description: "Legendary Tiki Bar happy hours and live summer music on the waterfront deck." },
  { id: "apizzapie", name: "APIZZAPIE", island: "lopez", area: "Lopez Village", lat: 48.516, lng: -122.900, cuisine: "Neapolitan Pizza", price: "$", walkFromDock: "1 mi", hours: "Mon-Tue, Thu-Sun 11AM-7PM", description: "Neapolitan-style pizza from a 700-degree stone hearth." },
  { id: "holly-bs", name: "Holly B's Bakery", island: "lopez", area: "Lopez Village", lat: 48.515, lng: -122.901, cuisine: "Bakery", price: "$", walkFromDock: "1 mi", hours: "Closed late Nov-early Apr", description: "Famous for cardamom coco knots and baguettes." }
];

const TRAILS = [
  // San Juan Island
  { id: "mt-finlayson", name: "Mount Finlayson Loop", island: "san-juan", area: "American Camp", lat: 48.460, lng: -123.03, difficulty: "Moderate", distance: "3.5 - 5.1 mi", elevGain: "295 ft", description: "Views of Cattle Point Lighthouse, Mount Baker, and the Olympic Mountains.", discoverPass: false },
  { id: "jakles-lagoon", name: "Jakle's Lagoon Nature Trail", island: "san-juan", area: "American Camp", lat: 48.465, lng: -123.02, difficulty: "Easy", distance: "1 mi loop", elevGain: "Minimal", description: "Island's most accessible path through wetlands.", discoverPass: false },
  { id: "south-beach", name: "South Beach", island: "san-juan", area: "American Camp", lat: 48.455, lng: -123.03, difficulty: "Easy", distance: "2 mi", elevGain: "Minimal", description: "Ocean bluff walking with possible whale sightings.", discoverPass: false },
  { id: "young-hill", name: "Young Hill Trail", island: "san-juan", area: "English Camp", lat: 48.585, lng: -123.14, difficulty: "Moderate-Strenuous", distance: "2 mi round trip", elevGain: "650 ft", description: "360-degree panoramic views of Olympic Peninsula, Haro Strait, Canadian Gulf Islands. Native Garry Oak forest and 1860s Royal Marines cemetery.", discoverPass: false },
  { id: "lime-kiln", name: "Lime Kiln Point Loop", island: "san-juan", area: "Lime Kiln Point State Park", lat: 48.516, lng: -123.152, difficulty: "Easy", distance: "1.4 mi loop", elevGain: "Minimal", description: "One of the world's best land-based whale watching locations. 1919 lighthouse, restored lime kilns, hydrophone for live orca calls.", discoverPass: true },

  // Orcas Island — Moran State Park
  { id: "cascade-falls", name: "Cascade Falls Trail", island: "orcas", area: "Moran State Park", lat: 48.66, lng: -122.87, difficulty: "Easy", distance: "0.25 mi", elevGain: "Minimal", description: "Spectacular waterfall in minutes from the trailhead.", discoverPass: true },
  { id: "cascade-lake-loop", name: "Cascade Lake Loop", island: "orcas", area: "Moran State Park", lat: 48.66, lng: -122.87, difficulty: "Easy", distance: "2.7 mi", elevGain: "Minimal", description: "Circles the main lake with swimming access.", discoverPass: true },
  { id: "mountain-lake-loop", name: "Mountain Lake Loop", island: "orcas", area: "Moran State Park", lat: 48.67, lng: -122.87, difficulty: "Easy/Moderate", distance: "3.9 mi", elevGain: "Moderate", description: "More peaceful lakeside circuit.", discoverPass: true },
  { id: "cold-springs", name: "Cold Springs Trail", island: "orcas", area: "Moran State Park", lat: 48.68, lng: -122.88, difficulty: "Difficult", distance: "4.3 mi one-way", elevGain: "2,058 ft", description: "Climbs Mount Constitution's west face with switchbacks and East Sound vistas.", discoverPass: true },
  { id: "mt-constitution-loop", name: "Mount Constitution Loop", island: "orcas", area: "Moran State Park", lat: 48.68, lng: -122.87, difficulty: "Difficult", distance: "6.7 mi", elevGain: "1,490 ft", description: "Eastern ascent from Mountain Lake. CCC-built 1936 stone observation tower at summit — views of Baker, Cascades, Vancouver Island, Rainier.", discoverPass: true },
  { id: "twin-lakes", name: "Twin Lakes Loop", island: "orcas", area: "Moran State Park", lat: 48.67, lng: -122.86, difficulty: "Moderate", distance: "5.2 mi", elevGain: "850 ft", description: "Connects Twin Lakes with Mountain Lake via forested ridgeline. Quieter alternative to the Constitution routes.", discoverPass: true },
  { id: "pickett-peak", name: "Pickett Peak Trail", island: "orcas", area: "Moran State Park", lat: 48.67, lng: -122.85, difficulty: "Moderate-Strenuous", distance: "3.2 mi round trip", elevGain: "1,100 ft", description: "Steep ascent to a secondary summit with views of the Strait of Georgia and Canadian Gulf Islands.", discoverPass: true },
  { id: "entrance-mountain", name: "Entrance Mountain Trail", island: "orcas", area: "Moran State Park", lat: 48.66, lng: -122.85, difficulty: "Moderate", distance: "4 mi round trip", elevGain: "800 ft", description: "Ascent to the park's eastern summit with panoramic views of Rosario Strait and the outer islands.", discoverPass: true },
  { id: "turtleback", name: "Turtleback Mountain Preserve", island: "orcas", area: "West Orcas", lat: 48.62, lng: -122.97, difficulty: "Moderate", distance: "Varies", elevGain: "Varies", description: "Views of West Sound. Managed by San Juan County Land Bank.", discoverPass: false },
  { id: "obstruction-pass", name: "Obstruction Pass State Park", island: "orcas", area: "SE Orcas", lat: 48.6085, lng: -122.8264, difficulty: "Easy/Moderate", distance: "Varies", elevGain: "Minimal", description: "Old-growth forest trails to secluded beach at island's southeastern tip.", discoverPass: false },

  // Lopez Island
  { id: "shark-reef", name: "Shark Reef Sanctuary", island: "lopez", area: "South Lopez", lat: 48.46, lng: -122.93, difficulty: "Easy", distance: "1 mi round trip", elevGain: "Minimal", description: "Boardwalk through old-growth forest to rocky shoreline. Seal and sea lion colonies, strongest currents in the San Juans.", discoverPass: false },
  { id: "iceberg-point", name: "Iceberg Point", island: "lopez", area: "South Lopez", lat: 48.44, lng: -122.89, difficulty: "Easy/Moderate", distance: "2 mi round trip", elevGain: "Minimal", description: "Island's top-rated hike. Forest to windswept coastal meadow at rocky cliffs. Camas lily fields, whale watching. San Juan Islands National Monument.", discoverPass: false },
  { id: "watmough-bay", name: "Watmough Bay", island: "lopez", area: "South Lopez", lat: 48.44, lng: -122.87, difficulty: "Easy (scramble option)", distance: "1 mi", elevGain: "Minimal (scramble adds significant elevation)", description: "Flat coastal trail to sandy cove with Mount Baker framed perfectly on clear days. Watmough Head scramble for panoramic summit views.", discoverPass: false },

  // Sucia Island
  { id: "sucia-loop", name: "Sucia Island Loop", island: "sucia", area: "Sucia Island", lat: 48.757, lng: -122.90, difficulty: "Moderate", distance: "4.2 mi", elevGain: "419 ft", description: "Best overview of the island. Johnson Point and Shallow Bay with views of Strait of Georgia.", discoverPass: false },
  { id: "echo-bay-loop", name: "Echo Bay Extended Loop", island: "sucia", area: "Sucia Island", lat: 48.76, lng: -122.91, difficulty: "Moderate", distance: "8.9 mi", elevGain: "Varies", description: "Near-complete island perimeter circuit.", discoverPass: false },
  { id: "ev-henry", name: "Ev Henry Trail", island: "sucia", area: "Sucia Island", lat: 48.752, lng: -122.91, difficulty: "Easy/Moderate", distance: "Varies", elevGain: "Varies", description: "Fossil Bay overlook of Fox Cove and Little Sucia Island. Named for the yachtsman who led preservation.", discoverPass: false },

  // James Island
  { id: "james-loop", name: "James Island Loop Trail", island: "james", area: "James Island", lat: 48.513, lng: -122.773, difficulty: "Easy/Moderate", distance: "1.5 mi loop", elevGain: "Moderate", description: "Circles central and southwest portions. High bluff views of San Juans and Thatcher Pass. Northern half closed as Natural Forest Area.", discoverPass: false },

  // Vendovi Island
  { id: "paintbrush-point", name: "Paintbrush Point Trail", island: "vendovi", area: "Vendovi Island", lat: 48.608, lng: -122.609, difficulty: "Easy/Moderate", distance: "1.8 mi", elevGain: "Minimal", description: "Dense forest to overlook. Access to 6 pristine beaches. Exceptional native flora — camas, paintbrush, fawn lilies.", discoverPass: false },

  // Stuart Island
  { id: "turn-point-lighthouse", name: "Turn Point Lighthouse Trail", island: "stuart", area: "Stuart Island", lat: 48.682, lng: -123.236, difficulty: "Easy/Moderate", distance: "3.5 mi round trip", elevGain: "Minimal", description: "From Reid Harbor or Prevost Harbor to the 1893 Turn Point Lighthouse at the island's western tip. Views into Canadian waters.", discoverPass: false },

  // Patos Island
  { id: "patos-loop", name: "Patos Island Loop", island: "patos", area: "Patos Island", lat: 48.787, lng: -122.972, difficulty: "Easy", distance: "1.5 mi loop", elevGain: "Minimal", description: "Loop trail through madrone forest to the 1893 lighthouse at the western point. Tended by volunteer Keepers of the Patos Light.", discoverPass: false, seasonalNotes: "Lighthouse open summer weekends only" },

  // Cypress Island
  { id: "eagle-cliff", name: "Eagle Cliff Trail", island: "cypress", area: "Cypress Island", lat: 48.581, lng: -122.694, difficulty: "Moderate-Strenuous", distance: "3 mi round trip", elevGain: "750 ft", description: "Summit climb to a 750-foot viewpoint overlooking Rosario Strait and the San Juan archipelago. DNR-managed.", discoverPass: false, seasonalNotes: "CLOSED Feb 1 - Jul 15 for raptor nesting" },
  { id: "cypress-lakes", name: "Reed Lake & Duck Lake Loop", island: "cypress", area: "Cypress Island", lat: 48.578, lng: -122.700, difficulty: "Moderate", distance: "4 mi loop", elevGain: "400 ft", description: "Loop connecting three freshwater lakes through old-growth forest. Reed Lake has a wildlife observation blind at the NE corner. Watch for bald eagles and great blue herons.", discoverPass: false },

  // Jones Island
  { id: "jones-island-trails", name: "Jones Island Trail Network", island: null, area: "Jones Island", lat: 48.617, lng: -123.044, difficulty: "Easy", distance: "4 mi total", elevGain: "Minimal", description: "Network of trails including an ADA-accessible paved path. Tame black-tailed deer and a small heritage orchard.", discoverPass: false }
];

const GALLERIES = [
  { id: "arctic-raven", name: "Arctic Raven Gallery", island: "san-juan", area: "Friday Harbor", walkFromDock: "0.1 mi", type: "gallery", description: "Northwest Coast Native art — masks, carvings, prints from Coast Salish, Haida, and Tlingit nations. 130 First Street S." },
  { id: "waterworks", name: "WaterWorks Gallery", island: "san-juan", area: "Friday Harbor", walkFromDock: "0.2 mi", type: "gallery", description: "Contemporary Pacific Northwest artists since 1985." },
  { id: "island-studios", name: "Island Studios", island: "san-juan", area: "Friday Harbor", walkFromDock: "0.3 mi", type: "gallery", description: "Exclusively represents artists living in the San Juans. 270 Spring Street." },
  { id: "sji-museum-art", name: "San Juan Islands Museum of Art", island: "san-juan", area: "Friday Harbor", walkFromDock: "0.3 mi", type: "museum", description: "Rotating exhibitions Fri-Mon 11AM-5PM. Administers the Sculpture Park near Roche Harbor. 540 Spring Street." },
  { id: "sculpture-park", name: "San Juan Islands Sculpture Park", island: "san-juan", area: "Roche Harbor", walkFromDock: "Near Roche Harbor", type: "sculpture_park", description: "Free 20-acre outdoor park with 150 sculptures across 5 trails. Open dawn to dusk year-round." },
  { id: "orcas-pottery", name: "Orcas Island Pottery", island: "orcas", area: "Eastsound", walkFromDock: "drive/shuttle", type: "gallery", description: "Oldest pottery in the Pacific Northwest (est. 1945). Whimsical gardens, working artists." },
  { id: "orcas-artworks", name: "Orcas Island Artworks", island: "orcas", area: "Olga", walkFromDock: "drive", type: "gallery", description: "Cooperative in a 1938 strawberry barreling plant. 45 island artists — pottery, glass, wood, fiber." },
  { id: "crow-valley", name: "Crow Valley Gallery", island: "orcas", area: "Eastsound", walkFromDock: "drive/shuttle", type: "gallery", description: "Waterfront gallery since 1959." },
  { id: "chimera", name: "Chimera Gallery", island: "lopez", area: "Lopez Village", walkFromDock: "1 mi", type: "gallery", description: "Cooperative (est. 1987) — painting, ceramics, glass, fiber, metalwork." },
  { id: "mohlman", name: "Peter A. Mohlman Fine Arts & Design", island: "orcas", area: "Eastsound", walkFromDock: "drive/shuttle", type: "artist_studio", description: "Working artist gallery and teaching studio. Atlanta College of Art-trained, full-time Orcas resident. Watercolor and acrylic landscapes. Classes $50 (3-class min) or $65 individual; scholarships available." },
  { id: "darvills", name: "Darvill's Bookstore", island: "orcas", area: "Eastsound", walkFromDock: "drive/shuttle", type: "bookstore", description: "Independent bookstore and coffee bar for 35+ years. Batdorf & Bronson and Dancing Goats coffee. Overlooks the Sound. 296 Main Street." }
];

const WELLNESS = [
  { id: "studio-sji", name: "The Studio SJI", island: "san-juan", area: "Friday Harbor", walkFromDock: "0.3 mi", description: "Drop-in Pilates, yoga, barre, TRX, and sound healing Mon-Fri. 278 A Street." },
  { id: "island-soul", name: "Island Soul Studios", island: "san-juan", area: "Friday Harbor", description: "Hatha and Vinyasa yoga in far-infrared-heated studio. Free/donation to $15. 326 Carter Avenue." },
  { id: "sji-fitness", name: "San Juan Island Fitness", island: "san-juan", area: "Friday Harbor", description: "Pool access plus Mon/Wed yoga classes. 435 Argyle Avenue." },
  { id: "orcas-mandala", name: "Orcas Mandala Yoga & Bodywork", island: "orcas", area: "Eastsound", description: "Drop-in classes in multiple styles." },
  { id: "doe-bay", name: "Doe Bay Resort & Retreat", island: "orcas", area: "SE Orcas", description: "Outdoor oceanview hot tubs, sauna, cold plunge, organic farm cafe. Year-round yoga retreats." },
  { id: "altar-lopez", name: "ALTAR Movement Studio", island: "lopez", area: "Lopez Island", description: "Yin yoga, ashtanga flow, and meditation." },
  { id: "lopez-fit", name: "Lopez Fit", island: "lopez", area: "Lopez Island", description: "Drop-in yoga Mon/Wed/Fri $15/session." }
];
