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
  }
];
