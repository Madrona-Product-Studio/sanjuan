/**
 * San Juan Islands Discovery Guide — Island Data
 * Structured from reference/discovery-guide.md and reference/dock-coordinates.md
 */

const ISLANDS = [
  {
    id: "san-juan",
    name: "San Juan Island",
    tagline: "Friday Harbor & Roche Harbor anchor the cruising experience",
    description: "San Juan Island's two marinas bookend the island and offer fundamentally different experiences. Friday Harbor places boaters in a walkable downtown, while Roche Harbor delivers a self-contained resort village 10 miles to the northwest.",
    center: { lat: 48.535, lng: -123.05 },
    zoom: 11,
    ferryServed: true,
    highlights: ["Walkable downtown Friday Harbor", "Roche Harbor resort village", "Lime Kiln whale watching", "23+ miles of trails"],
    imageColor: "#2196F3"
  },
  {
    id: "orcas",
    name: "Orcas Island",
    tagline: "The archipelago's most dramatic terrain",
    description: "Orcas Island's horseshoe shape concentrates attractions along a corridor from Deer Harbor in the southwest to Moran State Park in the east, with Eastsound village as the commercial and cultural hub.",
    center: { lat: 48.63, lng: -122.92 },
    zoom: 11,
    ferryServed: true,
    highlights: ["Mount Constitution (2,409 ft)", "James Beard-nominated dining", "Three marinas", "Moran State Park (5,252 acres)"],
    imageColor: "#4CAF50"
  },
  {
    id: "lopez",
    name: "Lopez Island",
    tagline: "The Friendly Isle — flat roads and Fisherman Bay moorage",
    description: "Lopez Island is the flattest of the ferry-served San Juans and the archipelago's premier cycling destination. Its character is quieter and more agricultural than San Juan or Orcas.",
    center: { lat: 48.48, lng: -122.90 },
    zoom: 11,
    ferryServed: true,
    highlights: ["Premier cycling (31.5-mile loop)", "Shark Reef Sanctuary", "Iceberg Point hikes", "Fisherman Bay moorage"],
    imageColor: "#FF9800"
  },
  {
    id: "shaw",
    name: "Shaw Island",
    tagline: "The quietest ferry stop demands self-sufficiency",
    description: "Shaw Island, the smallest of the four ferry-served islands at 7.7 square miles with 188 residents, operates essentially without commercial tourism infrastructure by community design.",
    center: { lat: 48.56, lng: -122.94 },
    zoom: 12,
    ferryServed: true,
    highlights: ["No restaurants or hotels", "11.5 miles of peaceful roads", "Indian Cove county park", "Ultimate quiet escape"],
    imageColor: "#9C27B0"
  },
  {
    id: "sucia",
    name: "Sucia Island",
    tagline: "The crown jewel of San Juan marine parks",
    description: "Sucia Island State Park — 564 acres accessible only by boat — is widely considered the finest marine state park in Washington. Its hand-shaped form creates six distinct moorage bays connected by approximately 10 miles of hiking trails.",
    center: { lat: 48.757, lng: -122.90 },
    zoom: 13,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["6 distinct moorage bays", "48 mooring buoys", "75-million-year-old fossils", "China Caves sandstone formations"],
    imageColor: "#FF5722"
  },
  {
    id: "vendovi",
    name: "Vendovi Island",
    tagline: "A fragile preserve with a closing access window",
    description: "Vendovi Island, a 217-acre nature preserve managed by the San Juan Preservation Trust, sits between Guemes and Lummi Islands near Bellingham Bay. Strict day-use rules and approximately 2,500 annual visitors.",
    center: { lat: 48.608, lng: -122.609 },
    zoom: 13,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["217-acre nature preserve", "6 pristine beaches", "3 miles of trails", "Exceptional native flora"],
    imageColor: "#00BCD4"
  },
  {
    id: "james",
    name: "James Island",
    tagline: "A Rosario Strait crossing with dramatic rewards",
    description: "James Island's 581 acres form an hourglass shape — two forested hills rising 200+ feet connected by a low isthmus with two white sand beaches — located 3 miles west of Anacortes.",
    center: { lat: 48.513, lng: -122.773 },
    zoom: 13,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["Hourglass-shaped island", "Two white sand beaches", "Bluff-top hiking trails", "Rosario Strait views"],
    imageColor: "#795548"
  },
  {
    id: "stuart",
    name: "Stuart Island",
    tagline: "Two harbors and the Turn Point Lighthouse",
    description: "Stuart Island sits near the Canadian border with two protected harbors connected by a 3.5-mile trail to the 1893 Turn Point Lighthouse. One of the most rewarding destinations in the San Juans for boaters willing to make the crossing.",
    center: { lat: 48.682, lng: -123.196 },
    zoom: 13,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["Turn Point Lighthouse (1893)", "Reid & Prevost harbors", "20 mooring buoys", "Near Canadian border"],
    imageColor: "#5D6D7E"
  },
  {
    id: "cypress",
    name: "Cypress Island",
    tagline: "Eagle Cliff and the crown jewel of DNR lands",
    description: "Cypress Island's 1,730 acres of DNR-managed forest and shoreline make it one of the largest undeveloped islands in the San Juans. The Eagle Cliff trail climbs to a 750-foot summit with panoramic views across Rosario Strait.",
    center: { lat: 48.581, lng: -122.694 },
    zoom: 13,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["Eagle Cliff (750 ft summit)", "Reed Lake wildlife blind", "Free DNR mooring buoys", "WWII-era airfield ruins"],
    imageColor: "#2E7D32"
  },
  {
    id: "patos",
    name: "Patos Island",
    tagline: "The northernmost island and true wilderness solitude",
    description: "Patos Island's 207 acres of madrone forest sit at the northern edge of the San Juans, closer to Canada than to any ferry terminal. The 1893 lighthouse is tended by volunteer Keepers of the Patos Light.",
    center: { lat: 48.787, lng: -122.972 },
    zoom: 14,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["Northernmost San Juan island", "1893 lighthouse", "Madrone forest", "True wilderness solitude"],
    imageColor: "#8D6E63"
  },
  {
    id: "clark",
    name: "Clark Island",
    tagline: "Madrone groves and genuine solitude",
    description: "Clark Island's 55 acres of rocky beaches and old-growth madrone groves see fewer visitors than Sucia or Jones, offering the kind of quiet that defined the San Juans a generation ago. Unusual among outer islands for having usable cellular service.",
    center: { lat: 48.728, lng: -122.770 },
    zoom: 14,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["9 mooring buoys", "Old-growth madrone", "Genuine solitude", "Cellular service (rare)"],
    imageColor: "#A1887F"
  },
  {
    id: "decatur",
    name: "Decatur Island",
    tagline: "A quiet anchorage between Lopez and the ferry lanes",
    description: "Decatur Island is mostly private residential land with a small marine state park at James Island's doorstep. The day-use park on the northwest shore offers mooring buoys and a pocket beach, making it a convenient lunch stop between Lopez and Anacortes.",
    center: { lat: 48.508, lng: -122.810 },
    zoom: 13,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["Day-use marine state park", "Mooring buoys", "Between Lopez & Anacortes", "Quiet anchorage"],
    imageColor: "#78909C"
  },
  {
    id: "matia",
    name: "Matia Island",
    tagline: "A Wildlife Refuge with one permitted landing",
    description: "Matia Island's 145 acres are split between a National Wildlife Refuge and a state park campground at Rolfe Cove. Only the Rolfe Cove dock and a short trail to the campground are open to visitors. All other shoreline is closed to protect nesting seabirds and marine mammals.",
    center: { lat: 48.748, lng: -122.843 },
    zoom: 14,
    ferryServed: false,
    boatAccessOnly: true,
    highlights: ["National Wildlife Refuge", "Rolfe Cove dock access only", "Old-growth forest", "Nesting seabird habitat"],
    imageColor: "#546E7A"
  }
];
