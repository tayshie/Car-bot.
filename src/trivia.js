const QUESTIONS = {
  'adult swim': [
    {
      q: 'What color is Carl\'s Dodge Stealth ES?',
      options: ['Red', 'Blue', 'Black', 'Purple'],
      answer: 0,
    },
    {
      q: 'Which Aqua Teen lives in a trash can?',
      options: ['Meatwad', 'Master Shake', 'Frylock', 'Carl'],
      answer: 0,
    },
    {
      q: 'What is Master Shake made of?',
      options: ['A milkshake', 'Whipped cream', 'Mystery meat', 'Old milk'],
      answer: 0,
    },
    {
      q: 'What does Frylock shoot out of his eyes?',
      options: ['Lasers', 'BBs', 'Peanut butter', 'Snot'],
      answer: 0,
    },
    {
      q: 'Which show is NOT an Adult Swim show?',
      options: ['Family Guy', 'ATHF', 'Rick and Morty', 'Robot Chicken'],
      answer: 0,
    },
    {
      q: 'What body part does Carl have hair on?',
      options: ['Everywhere', 'Only his head', 'His palms', 'Nowhere'],
      answer: 0,
    },
    {
      q: 'What does Carl drink?',
      options: ['Beer', 'Faygo', 'Water', 'Milk'],
      answer: 0,
    },
    {
      q: 'Who is Carl\'s neighbor?',
      options: ['The Aqua Teens', 'A family of robots', 'A wizard', 'Nobody'],
      answer: 0,
    },
    {
      q: 'What network is ATHF on?',
      options: ['Adult Swim', 'Nickelodeon', 'MTV', 'Comedy Central'],
      answer: 0,
    },
    {
      q: 'What is the Aqua Teen\'s house color?',
      options: ['Brown', 'Green', 'Blue', 'Pink'],
      answer: 0,
    },
  ],
  'classic rock': [
    {
      q: 'What band sang "More Than a Feeling"?',
      options: ['Boston', 'Foreigner', 'Kansas', 'Styx'],
      answer: 0,
    },
    {
      q: 'What band sang "Don\'t Stop Believin\'"?',
      options: ['Journey', 'Queen', 'Boston', 'Rush'],
      answer: 0,
    },
    {
      q: 'What band sang "Sweet Home Alabama"?',
      options: ['Lynyrd Skynyrd', 'The Eagles', 'ZZ Top', 'AC/DC'],
      answer: 0,
    },
    {
      q: 'What band sang "Carry On Wayward Son"?',
      options: ['Kansas', 'Foreigner', 'Styx', 'REO Speedwagon'],
      answer: 0,
    },
    {
      q: 'What band sang "Hotel California"?',
      options: ['The Eagles', 'Fleetwood Mac', 'Boston', 'The Doobie Brothers'],
      answer: 0,
    },
    {
      q: 'Who sang "Born to Run"?',
      options: ['Bruce Springsteen', 'Bob Seger', 'John Mellencamp', 'Tom Petty'],
      answer: 0,
    },
    {
      q: 'What band sang "Tom Sawyer"?',
      options: ['Rush', 'Styx', 'Yes', 'Genesis'],
      answer: 0,
    },
    {
      q: 'What band sang "We Will Rock You"?',
      options: ['Queen', 'AC/DC', 'The Rolling Stones', 'Aerosmith'],
      answer: 0,
    },
    {
      q: 'Who sang "Bad to the Bone"?',
      options: ['George Thorogood', 'Johnny Cash', 'Steve Miller', 'Joe Walsh'],
      answer: 0,
    },
    {
      q: 'What band sang "Smoke on the Water"?',
      options: ['Deep Purple', 'Led Zeppelin', 'Black Sabbath', 'Pink Floyd'],
      answer: 0,
    },
  ],
  juggalo: [
    {
      q: 'What does ICP stand for?',
      options: ['Insane Clown Posse', 'Insane Clown People', 'Ill Clown Posse', 'Inner City Posse'],
      answer: 0,
    },
    {
      q: 'What is the juggalo drink of choice?',
      options: ['Faygo', 'Mountain Dew', 'Fanta', 'Dr Pepper'],
      answer: 0,
    },
    {
      q: 'What is the ICP gathering called?',
      options: ['Gathering of the Juggalos', 'Clown Convention', 'Hatchet Fest', 'Carnival Clash'],
      answer: 0,
    },
    {
      q: 'What is ICP\'s symbol?',
      options: ['The Hatchet Man', 'A clown nose', 'A boom mic', 'A wicked clown'],
      answer: 0,
    },
    {
      q: 'What is the Dark Carnival?',
      options: ['ICP\'s mythology', 'A theme park', 'A traveling show', 'A mixtape series'],
      answer: 0,
    },
    {
      q: 'ICP is from which city?',
      options: ['Detroit', 'Chicago', 'Cleveland', 'Atlanta'],
      answer: 0,
    },
    {
      q: 'Who are ICP?',
      options: ['Violent J and Shaggy 2 Dope', 'Shaggy and Scooby', 'Madrox and Monoxide', 'Juggalo Jim and Twiztid'],
      answer: 0,
    },
    {
      q: 'Whoop whoop! What do juggalos call each other?',
      options: ['Family', 'Clowns', 'Ninjas', 'Wicked ones'],
      answer: 0,
    },
    {
      q: 'What flavor of Faygo is most famous?',
      options: ['Redpop', 'Grape', 'Orange', 'Moon Mist'],
      answer: 0,
    },
    {
      q: 'Juggalos are part of what larger group?',
      options: ['The Juggalo Family', 'The Clown Gang', 'The Hatchet Crew', 'The Dark Family'],
      answer: 0,
    },
  ],
  sports: [
    {
      q: 'How many players on a basketball team on the court?',
      options: ['5', '6', '7', '11'],
      answer: 0,
    },
    {
      q: 'How many points is a touchdown?',
      options: ['6', '3', '7', '5'],
      answer: 0,
    },
    {
      q: 'What is a strike in bowling worth?',
      options: ['10 pins plus bonus', '5 pins', '8 pins', '15 pins'],
      answer: 0,
    },
    {
      q: 'How many innings in a baseball game?',
      options: ['9', '7', '10', '12'],
      answer: 0,
    },
    {
      q: 'How many players on an NFL team on the field?',
      options: ['11', '9', '10', '12'],
      answer: 0,
    },
    {
      q: 'What is a "birdie" in golf?',
      options: ['One under par', 'One over par', 'Two under par', 'Par'],
      answer: 0,
    },
    {
      q: 'How many points is a field goal in football?',
      options: ['3', '2', '6', '7'],
      answer: 0,
    },
    {
      q: 'How many strikes to a perfect game in bowling?',
      options: ['12', '10', '9', '11'],
      answer: 0,
    },
    {
      q: 'What is the Super Bowl?',
      options: ['The NFL championship', 'A soup bowl', 'A halftime show', 'A college bowl game'],
      answer: 0,
    },
    {
      q: 'How many periods in a hockey game?',
      options: ['3', '2', '4', '5'],
      answer: 0,
    },
  ],
  general: [
    {
      q: 'How many seconds are in a minute?',
      options: ['60', '100', '30', '45'],
      answer: 0,
    },
    {
      q: 'What planet do we live on?',
      options: ['Earth', 'Mars', 'Venus', 'Neptune'],
      answer: 0,
    },
    {
      q: 'What is the fastest land animal?',
      options: ['Cheetah', 'Lion', 'Horse', 'Gazelle'],
      answer: 0,
    },
    {
      q: 'How many continents are there?',
      options: ['7', '5', '6', '8'],
      answer: 0,
    },
    {
      q: 'What gas do plants breathe in?',
      options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'],
      answer: 0,
    },
    {
      q: 'How many legs does a spider have?',
      options: ['8', '6', '10', '4'],
      answer: 0,
    },
    {
      q: 'What is the largest planet?',
      options: ['Jupiter', 'Saturn', 'Earth', 'Uranus'],
      answer: 0,
    },
    {
      q: 'How many days are in a leap year?',
      options: ['366', '365', '364', '367'],
      answer: 0,
    },
    {
      q: 'What is the tallest animal?',
      options: ['Giraffe', 'Elephant', 'Ostrich', 'Camel'],
      answer: 0,
    },
    {
      q: 'What color is the sky on a clear day?',
      options: ['Blue', 'Green', 'Red', 'Yellow'],
      answer: 0,
    },
  ],
};

export const CATEGORIES = ['adult swim', 'classic rock', 'juggalo', 'sports', 'general'];

export function getQuestions(category) {
  return QUESTIONS[category] || [];
}

export function pickQuestion(category) {
  const bank = category === 'any' || !QUESTIONS[category]
    ? Object.values(QUESTIONS).flat()
    : QUESTIONS[category];
  return bank[Math.floor(Math.random() * bank.length)];
}
