/**
 * San Juan Islands Boating Guide — Farms & Producers Data
 * Dedicated producer entries. Some dining entries also surface here via producer: true flag.
 */

const FARMS = [
  {
    id: "pelindaba",
    name: "Pelindaba Lavender Farm",
    island: "san-juan",
    area: "San Juan Island",
    lat: 48.520,
    lng: -123.08,
    type: "Lavender Farm",
    tastingOrTours: true,
    hours: "Farm store 9:30 AM - 5:30 PM; fields always open; free admission",
    price: "Free (products for sale)",
    description: "25 acres with 25,000 plants of three lavender species. Organic certified with 200+ products made on site. Zulu name means 'place of great gatherings.'",
    seasonalNotes: "Peak bloom mid-June through mid-July; still purple through August"
  },
  {
    id: "westcott-bay-farm",
    name: "Westcott Bay Shellfish Co.",
    island: "san-juan",
    area: "Roche Harbor",
    lat: 48.593,
    lng: -123.152,
    type: "Shellfish Farm",
    tastingOrTours: true,
    hours: "Self-serve stand open daily; check seasonal hours",
    price: "$",
    description: "Working shellfish farm on Westcott Bay growing Pacific and Kumamoto oysters, Manila clams, and Mediterranean mussels. Self-serve retail stand lets you shuck on the picnic tables overlooking the bay.",
    seasonalNotes: "Best selection summer through fall. Bring your own shucking knife."
  },
  {
    id: "san-juan-island-distillery",
    name: "San Juan Island Distillery",
    island: "san-juan",
    area: "Friday Harbor",
    lat: 48.533,
    lng: -123.012,
    type: "Distillery & Cidery",
    tastingOrTours: true,
    hours: "Tasting room Thu-Mon; check seasonal schedule",
    price: "$",
    description: "Craft spirits distilled from estate and local fruit. Apple brandy, gin, and vodka alongside Westcott Bay Cider made from heritage apple orchards near Roche Harbor.",
    seasonalNotes: "Cider season peaks in fall"
  },
  {
    id: "buck-bay-farm",
    name: "Buck Bay Shellfish Farm",
    island: "orcas",
    area: "Olga",
    lat: 48.615,
    lng: -122.835,
    type: "Shellfish Farm",
    tastingOrTours: true,
    hours: "Sat 10 AM - 3 PM; check seasonal availability",
    price: "$",
    description: "Small family-run oyster farm at the head of Buck Bay on Orcas Island. Buy direct from the farm stand on Saturdays. Shucking tools and tables provided.",
    seasonalNotes: "Saturday farm stand seasonal; call ahead to confirm"
  },
  {
    id: "orcas-island-pottery",
    name: "Orcas Island Pottery",
    island: "orcas",
    area: "Eastsound",
    lat: 48.693,
    lng: -122.910,
    type: "Pottery Studio",
    tastingOrTours: true,
    hours: "Daily 10 AM - 5 PM (seasonal)",
    price: "Free to visit",
    description: "The oldest pottery in the Pacific Northwest, established 1945. Working artists throw and fire on site in a whimsical garden setting. Every piece is handmade on the island.",
    seasonalNotes: "Open daily in summer; reduced hours off-season"
  },
  {
    id: "doe-bay-wine",
    name: "Doe Bay Wine Company",
    island: "orcas",
    area: "Olga",
    lat: 48.640,
    lng: -122.827,
    type: "Winery",
    tastingOrTours: true,
    hours: "Tasting room hours vary; check website",
    price: "$",
    description: "Small-lot wines made from Washington and Oregon grapes, finished on Orcas Island. Tasting room at the eastern end of the island near Doe Bay Resort.",
    seasonalNotes: null
  },
  {
    id: "lopez-island-farm",
    name: "Lopez Island Farm",
    island: "lopez",
    area: "Lopez Island",
    lat: 48.480,
    lng: -122.880,
    type: "Organic Farm & Stand",
    tastingOrTours: false,
    hours: "Farm stand honor system; check roadside signs",
    price: "$",
    description: "Lopez's agricultural character shows in its roadside farm stands selling seasonal produce, eggs, and honey on the honor system. Multiple farms participate throughout the island.",
    seasonalNotes: "Best selection June through October"
  },
  {
    id: "lopez-island-creamery",
    name: "Lopez Island Creamery",
    island: "lopez",
    area: "Lopez Village",
    lat: 48.484,
    lng: -122.896,
    type: "Creamery & Ice Cream",
    tastingOrTours: false,
    hours: "Daily in summer; check seasonal hours",
    price: "$",
    description: "Small-batch ice cream made from local dairy and island ingredients. A Lopez Village institution. Flavors rotate with the seasons.",
    seasonalNotes: "Summer hours daily; limited or closed off-season"
  },
  {
    id: "island-bees-honey",
    name: "San Juan Island Apiaries",
    island: "san-juan",
    area: "San Juan Island",
    lat: 48.530,
    lng: -123.040,
    type: "Honey & Apiary",
    tastingOrTours: false,
    hours: "Available at Friday Harbor farmers market and local shops",
    price: "$",
    description: "Island-produced raw honey and beeswax products. The San Juans' mild maritime climate and wildflower meadows produce a distinctive light floral honey.",
    seasonalNotes: "Farmers market Saturdays, April through October"
  }
];
