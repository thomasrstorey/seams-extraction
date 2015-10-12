#!/usr/bin/env node

/*
extraction_test.js
thomas storey
disaster seminar
*/

var extraction = require('./extraction.js');

extraction.getRawEnergyMap(process.argv[2], function(map, img){
  var seam = extraction.findVerticalSeam(map, img);
  extraction.renderVerticalSeam(seam, img, process.argv[3]);
});
