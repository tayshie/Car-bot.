export function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

const BLACK_CARDS = [
  'The last thing I remember before blacking out: ___.',
  "What's that smell? Oh, it's ___.",
  'Instead of coffee, I start my day with ___.',
  'The secret ingredient in my chili is ___.',
  'What did I find in the back of my fridge? ___.',
  'My therapist says I have a problem with ___.',
  'The pastor would be shocked if he knew about ___.',
  'The reason my car got towed: ___.',
  'What did I name my pet? ___.',
  'My date canceled on me because of ___.',
  'My 401k? It consists entirely of ___.',
  'The reason my Stealth has 200k miles: ___.',
  'What do I keep under the passenger seat? ___.',
  'What am I thinking about right now? ___.',
  '___ ruined my weekend.',
  'The worst pickup line I ever used: ___.',
  'I blame my marriage ending on ___.',
  'My new workout routine is just ___.',
  'What did I bring to the potluck? ___.',
  '___ — just like my ex-wife said.',
  "What's in that jar on my nightstand? ___.",
  "What's buried under the porch? ___.",
  'What does the raccoon in my yard want? ___.',
  'The last thing I remember before the cops showed up: ___.',
  'My hobby is ___.',
  'The sound that kept me up all night: ___.',
  '___ is the reason I\'m single.',
  'What do I do with my tip money? ___.',
  'What are the Aqua Teens really up to? ___.',
  '___ is how I show affection.',
];

const WHITE_CARDS = [
  'A full-blown meth lab',
  'A glass pipe behind the counter at the gas station',
  'My cousin who cooks in the woods',
  'That weird dude at the truck stop',
  'A foil scraped clean',
  'Sudafed, all of it',
  'A "cooking show" that isn\'t on TV',
  'The blue stuff Walt made',
  'A burnt spoon and a lighter',
  'Stealing copper pipes for scrap',
  'A motel room with 14 extension cords',
  'A Chevy Malibu with no plates',
  'The tinfoil hat and the tinfoil bowl',
  'A basement full of beakers',
  'The one guy who still uses the word "skante"',
  'A three-day bender on nothing but adrenaline',
  'That parking lot behind the abandoned Kmart',
  'The propane tank in the trunk',
  'A roadside sign that says "REAL METH"',
  'My dentist giving me the side-eye',
  'A jug of anhydrous ammonia',
  'The guy who always has a flashlight',
  'A dented aluminum can',
  'Checking my own pulse at 4am',
  'The whole trailer park knowing my name',
  'A "medical" supply store with no windows',
  'Red phosphorus and bad decisions',
  'An energy drink the size of my head',
  'The neighbor\'s teenager who started selling',
  'A tripod of flashlights at 2am',
  'The Waffle House at 3am after day two',
  'My uncle\'s "fishing" trips to nowhere',
  'A roll of tinfoil in every pocket',
  'The sound of a catalytic converter being cut off',
  'A knock-off lighter that never works',
  'The freezer full of single-serve bottles',
  'A paper plate with a perfect circle of foil',
  'The smell of burning aluminum',
  'A dent in the hood from a thrown shoe',
  'The last person you\'d expect, actually',
  'A stack of cash with a rubber band',
  'The 24-hour Walmart restroom',
  'A blackout that lasts a week',
  'The sheriff\'s car idling across the street',
  'A case of empty Red Bulls',
  'The "bath salts" aisle at the corner store',
  'A new shiny refrigerator after the old one "disappeared"',
  'The plastic wrapper from a new mattress',
  'A friend who "knows a guy"',
  'The echo of my own jaw grinding',
  'A car alarm going off in my head',
  'The shadow person in the corner',
  'A dust storm under my bed',
  'The bugs crawling under my skin',
  'A whole month gone in one afternoon',
  'The neighbor kids walking in on me',
  'A garage that never gets the car in it',
  'The smell of my own clothes after day three',
  'A taped-up flashlight on a helmet',
  'The "repair" guy who never fixes anything',
  'A yard full of rusted appliances',
  'The check engine light and a prayer',
  'A vape shop that asks no questions',
  'The guy with the "it\'s not meth" shirt',
  'A random pile of Sudafed wrappers',
  'The 5am rumble of my own lawnmower',
  'A shower I haven\'t taken in weeks',
  'The empty beer cans that built a fort',
  'A bonfire of receipts and wrappers',
  'The crystal chandelier in the meth house',
  'A dog that looks like it knows too much',
  'The priest who keeps coming back to the trailer',
  'A cousin twice removed, once incarcerated',
  'The sound of tin foil in a silent room',
  'My own reflection in the microwave door',
  'A "free" couch that came with fleas and questions',
  'The gas station employee who remembers me',
  'A lamp made out of a bottle',
  'The neighbor\'s ring camera footage',
  'A brick wrapped in a diaper bag',
  'The dented mailbox that used to be a mailbox',
  'A roll of duct tape with one job left',
  'The Kmart lot at 2am, again',
  'A headlamp in a hoodie',
  'The "closed" laundromat with the light on',
  'A half-eaten gas station hot dog, day two',
  'The sound of my own heart, uninvited',
  'A five-hour "quick errand"',
  'The smoke alarm battery dying at 3am',
  'A "neighbor" who only comes out at night',
  'The dog house that\'s nicer than the house',
  'A paper sack with a suspicious rattle',
  'The rusted-out van that "just needs a jump"',
  'A "blessing" from the pastor that didn\'t help',
  'The county line you should\'ve stayed on this side of',
];

export function newDeck() {
  return {
    blacks: [...BLACK_CARDS],
    whites: [...WHITE_CARDS],
  };
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawBlack(deck) {
  if (!deck.blacks.length) deck.blacks = shuffle([...BLACK_CARDS]);
  return deck.blacks.splice(Math.floor(Math.random() * deck.blacks.length), 1)[0];
}

export function drawWhite(deck) {
  if (!deck.whites.length) deck.whites = shuffle([...WHITE_CARDS]);
  return deck.whites.splice(Math.floor(Math.random() * deck.whites.length), 1)[0];
}
