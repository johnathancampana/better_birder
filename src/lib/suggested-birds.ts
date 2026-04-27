export type SuggestedBird = {
  species_code: string;
  common_name: string;
  scientific_name: string;
  family: string;
};

// Common birds of the Northeastern United States
// Species codes verified against eBird taxonomy (April 2026)
export const SUGGESTED_BIRDS: SuggestedBird[] = [
  // Backyard regulars
  { species_code: "norcar",  common_name: "Northern Cardinal",       scientific_name: "Cardinalis cardinalis",     family: "Cardinals" },
  { species_code: "blujay",  common_name: "Blue Jay",                scientific_name: "Cyanocitta cristata",       family: "Jays & Crows" },
  { species_code: "amerob",  common_name: "American Robin",          scientific_name: "Turdus migratorius",        family: "Thrushes" },
  { species_code: "bkcchi",  common_name: "Black-capped Chickadee",  scientific_name: "Poecile atricapillus",      family: "Titmice & Chickadees" },
  { species_code: "tuftit",  common_name: "Tufted Titmouse",         scientific_name: "Baeolophus bicolor",        family: "Titmice & Chickadees" },
  { species_code: "dowwoo",  common_name: "Downy Woodpecker",        scientific_name: "Dryobates pubescens",       family: "Woodpeckers" },
  { species_code: "whbnut",  common_name: "White-breasted Nuthatch", scientific_name: "Sitta carolinensis",        family: "Nuthatches" },
  { species_code: "houfin",  common_name: "House Finch",             scientific_name: "Haemorhous mexicanus",      family: "Finches" },
  { species_code: "amegfi",  common_name: "American Goldfinch",      scientific_name: "Spinus tristis",            family: "Finches" },
  { species_code: "moudov",  common_name: "Mourning Dove",           scientific_name: "Zenaida macroura",          family: "Doves & Pigeons" },
  { species_code: "houspa",  common_name: "House Sparrow",           scientific_name: "Passer domesticus",         family: "Old World Sparrows" },
  { species_code: "sonspa",  common_name: "Song Sparrow",            scientific_name: "Melospiza melodia",         family: "New World Sparrows" },

  // Common at feeders & parks
  { species_code: "rebwoo",  common_name: "Red-bellied Woodpecker",  scientific_name: "Melanerpes carolinus",      family: "Woodpeckers" },
  { species_code: "haiwoo",  common_name: "Hairy Woodpecker",        scientific_name: "Dryobates villosus",        family: "Woodpeckers" },
  { species_code: "daejun",  common_name: "Dark-eyed Junco",         scientific_name: "Junco hyemalis",            family: "New World Sparrows" },
  { species_code: "chispa",  common_name: "Chipping Sparrow",        scientific_name: "Spizella passerina",        family: "New World Sparrows" },
  { species_code: "eursta",  common_name: "European Starling",       scientific_name: "Sturnus vulgaris",          family: "Starlings" },
  { species_code: "comgra",  common_name: "Common Grackle",          scientific_name: "Quiscalus quiscula",        family: "Blackbirds" },
  { species_code: "rewbla",  common_name: "Red-winged Blackbird",    scientific_name: "Agelaius phoeniceus",       family: "Blackbirds" },
  { species_code: "balori",  common_name: "Baltimore Oriole",        scientific_name: "Icterus galbula",           family: "Blackbirds" },

  // Raptors & larger birds
  { species_code: "rethaw",  common_name: "Red-tailed Hawk",         scientific_name: "Buteo jamaicensis",         family: "Hawks" },
  { species_code: "coohaw",  common_name: "Cooper's Hawk",           scientific_name: "Accipiter cooperii",        family: "Hawks" },
  { species_code: "baleag",  common_name: "Bald Eagle",              scientific_name: "Haliaeetus leucocephalus",  family: "Hawks & Eagles" },
  { species_code: "turvul",  common_name: "Turkey Vulture",          scientific_name: "Cathartes aura",            family: "Vultures" },
  { species_code: "grbher3", common_name: "Great Blue Heron",        scientific_name: "Ardea herodias",            family: "Herons" },
  { species_code: "cangoo",  common_name: "Canada Goose",            scientific_name: "Branta canadensis",         family: "Geese" },
  { species_code: "mallar3", common_name: "Mallard",                 scientific_name: "Anas platyrhynchos",        family: "Ducks" },

  // Warblers & migrants (spring/fall excitement)
  { species_code: "yerwar",  common_name: "Yellow-rumped Warbler",   scientific_name: "Setophaga coronata",        family: "Warblers" },
  { species_code: "yelwar",  common_name: "Yellow Warbler",          scientific_name: "Setophaga petechia",        family: "Warblers" },
  { species_code: "bawwar",  common_name: "Black-and-white Warbler", scientific_name: "Mniotilta varia",           family: "Warblers" },
  { species_code: "comyel",  common_name: "Common Yellowthroat",     scientific_name: "Geothlypis trichas",        family: "Warblers" },

  // Other common species
  { species_code: "amecro",  common_name: "American Crow",           scientific_name: "Corvus brachyrhynchos",     family: "Jays & Crows" },
  { species_code: "rthhum",  common_name: "Ruby-throated Hummingbird", scientific_name: "Archilochus colubris",   family: "Hummingbirds" },
  { species_code: "easblu",  common_name: "Eastern Bluebird",        scientific_name: "Sialia sialis",             family: "Thrushes" },
  { species_code: "cedwax",  common_name: "Cedar Waxwing",           scientific_name: "Bombycilla cedrorum",       family: "Waxwings" },
  { species_code: "grycat",  common_name: "Gray Catbird",            scientific_name: "Dumetella carolinensis",    family: "Mockingbirds" },
  { species_code: "normoc",  common_name: "Northern Mockingbird",    scientific_name: "Mimus polyglottos",         family: "Mockingbirds" },
  { species_code: "easpho",  common_name: "Eastern Phoebe",          scientific_name: "Sayornis phoebe",           family: "Flycatchers" },
  { species_code: "pilwoo",  common_name: "Pileated Woodpecker",     scientific_name: "Dryocopus pileatus",        family: "Woodpeckers" },
  { species_code: "brdowl",  common_name: "Barred Owl",              scientific_name: "Strix varia",               family: "Owls" },
];
