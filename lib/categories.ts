export const CATEGORIES = [
  "desk", "chair", "table", "sofa", "bed", "mattress", "dresser", "bookshelf", "storage",
  "lamp", "rug", "kitchenware", "appliance", "electronics", "decor", "clothing", "books", "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const FURNITURE: Category[] = ["desk", "chair", "table", "sofa", "bed", "mattress", "dresser", "bookshelf", "storage", "lamp", "rug"];

export const CATEGORY_LABEL: Record<Category, string> = {
  desk: "Desk", chair: "Chair", table: "Table", sofa: "Sofa", bed: "Bed", mattress: "Mattress",
  dresser: "Dresser", bookshelf: "Bookshelf", storage: "Storage", lamp: "Lamp", rug: "Rug",
  kitchenware: "Kitchenware", appliance: "Appliance", electronics: "Electronics", decor: "Decor",
  clothing: "Clothing", books: "Books", other: "Other",
};

/** word -> category. Words are lowercase singular. */
export const SYNONYMS: Record<string, Category> = {
  desk: "desk", "writing table": "desk", workstation: "desk", "study table": "desk",
  chair: "chair", "dressing chair": "chair", stool: "chair", "office chair": "chair", armchair: "chair",
  table: "table", "dressing table": "table", vanity: "table", "vanity table": "table", "dining table": "table", "coffee table": "table", nightstand: "table",
  sofa: "sofa", couch: "sofa", loveseat: "sofa", sectional: "sofa",
  bed: "bed", "bed frame": "bed", bedframe: "bed",
  mattress: "mattress",
  dresser: "dresser", drawers: "dresser", "chest of drawer": "dresser",
  bookshelf: "bookshelf", bookcase: "bookshelf", shelf: "bookshelf", shelving: "bookshelf",
  storage: "storage", bin: "storage", cabinet: "storage", wardrobe: "storage", closet: "storage",
  lamp: "lamp", light: "lamp",
  rug: "rug", carpet: "rug",
  kitchenware: "kitchenware", pot: "kitchenware", pan: "kitchenware", dish: "kitchenware", cookware: "kitchenware",
  appliance: "appliance", microwave: "appliance", fridge: "appliance", kettle: "appliance", toaster: "appliance",
  electronics: "electronics", monitor: "electronics", tv: "electronics", speaker: "electronics", laptop: "electronics",
  decor: "decor", mirror: "decor", poster: "decor", plant: "decor",
  clothing: "clothing", jacket: "clothing", coat: "clothing", clothes: "clothing",
  book: "books", textbook: "books",
};
