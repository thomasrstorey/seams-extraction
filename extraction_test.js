#!/usr/bin/env node

/*
extraction_test.js
thomas storey
disaster seminar
*/

var extraction = require('./extraction.js')(null, false);

// extraction.getRawEnergyMap(process.argv[2], function(map, img){
//   var seam = extraction.findVerticalSeam(map, img);
//   extraction.renderVerticalSeam(seam, img, process.argv[3]);
// });

extraction.extractVerticalSeams( process.argv[2], process.argv[3],
process.argv[4], process.argv[5], process.argv[6], process.argv[7], function(){
  console.log('extracted seams');
});
