const express = require("express");
const fs = require("fs");


// Helper method to alphabetize letters in a word
function sortWord(word) {
	return word.split("").sort().join("");
}

// This function loads our scrabble dictionary and seeds a map with a list of key-value pairs
// where the key is the sorted, capitalized letters that can be used to spell the words in the corresponding
// value array. We would have sets like "DORP" -> ["PROD", "DROP"] and "ACHNOR" -> ["ANCHOR"].
function loadScrabbleDictionaryMap() {
	// Read all the words in the scrabble dictionary, trim any whitespace, make all words all-caps
	let linesArray = fs.readFileSync(__dirname + "/resources/scrabble_dictionary.txt", "utf8")
						.split("\n")
						.map(word => word.trim().toUpperCase());

	const map = new Map();

	// Fill up our word lookup map with the format ALPHABETICALLY_SORTED_KEY -> [WORD1, WORD2, .. WORDn]
	linesArray.forEach(function(scrabbleWord) {

		// Alphabetically sort letters of scrabble word to form key of key-value pair
		let sortedWord = sortWord(scrabbleWord);

		let existingWords = map.get(sortedWord);
		
		// Since sorted keys can have multiple possible values (i.e. "PROD" and "DROP" would both have the key "DORP")
		// we need to link keys to arrays of possible words
		if(existingWords === undefined || existingWords === null){
			map.set(sortedWord, [scrabbleWord]);
		}
		else{
			existingWords.push(scrabbleWord);
			map.set(sortedWord, existingWords);
		}
	});

	return map;
}

// Algorithm taken from https://codereview.stackexchange.com/a/7042
function getStringCombinations(chars) {
  var result = [];
  var f = function(prefix, chars) {
    for (var i = 0; i < chars.length; i++) {
      result.push(prefix + chars[i]);
      f(prefix + chars[i], chars.slice(i + 1));
    }
  }
  f("", chars);
  return result;
}

// Algorithm taken from https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
function flattenArray(arrayOfArrays) {
	return [].concat.apply([], arrayOfArrays);
}


const map = loadScrabbleDictionaryMap()

const app = express();

// Send our index page when the user navigates to the root level of our homepage.
app.get("/", (req, res) => 
	res.sendFile(__dirname + "/templates/index.html"));

// This method takes a hand of scrabble tiles and returns an alphabetized list of the legal Scrabble words that
// can be used with it.
app.get("/lookup/:scrabbleTiles", (req, res) => 

{
	if(req.params.scrabbleTiles.length <= 7){
		// Get a list of keys to feed into our Scrabble dictionary map
		let possibleWordKeys = getStringCombinations(req.params.scrabbleTiles.toUpperCase())
								.filter(word => word.length > 1)
								.map(word => sortWord(word));

		// Feed our keys into our map to get the possible values and filter out the ones with no match
		let possibleScrabbleWords = possibleWordKeys.map(word => map.get(word))
									.filter(word => word != null);

		// Make the array of arrays one array and alphabetize it
		let cleanedScrabbleWords = flattenArray(possibleScrabbleWords).sort();

		// Make sure there are no duplicates by converting it from an array to a set and back (because sets can't have duplicates)
		let noDuplicatesScrabbleWords = Array.from(new Set(cleanedScrabbleWords))
		
		// Send it back to the client
		res.send(
			{ words: noDuplicatesScrabbleWords }
		);
	}
	else{
		throw new Error("You shouldn't have a hand of more than 7 Scrabble tiles!");
	}
})

app.listen(8080, () => console.log("Running on port 8080"));