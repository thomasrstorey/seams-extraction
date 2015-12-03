/*
extraction.js
thomas storey
disaster seminar
*/
module.exports = function (renderOut, realtime) {
  var png = require('node-png').PNG;
  var _   = require('lodash');
  var fs  = require('fs');

  var self = {};
  var pxNum = 1;
  self.renderEnergyMap = function ( inpath, outpath, cb ) {

    getSourceImage(inpath, function(imgdata){
      var rawmap = getEnergyMap(imgdata);
      var resultimg = new png({filterType: 4});
      resultimg.data = formatEnergyMap(rawmap);
      resultimg.height = imgdata.height;
      resultimg.width = imgdata.width;
      resultimg.pack().pipe(fs.createWriteStream(outpath || 'out.png'));
      return cb(resultimg);
    });

  };

  self.getRawEnergyMap = function ( inpath, cb ) {
    getSourceImage(inpath, function(imgdata){
      var rawmap = getEnergyMap(imgdata);
      return cb(rawmap, imgdata);
    });
  };

  self.renderVerticalSeam = function ( seam, img, outpath ){
    var resultimg = new png({filterType: 4});
    resultimg.height = img.height;
    resultimg.width = img.width;
    console.log(img.width, img.height);
    console.log(img.data.length);
    var data = img.data;
    seam.forEach(function(x, y){
      console.log(x, y, indexFromCoords(x,y,img.width,img.height));
      data[indexFromCoords(x,y,img.width,img.height)] = 255;
      data[indexFromCoords(x,y,img.width,img.height)] = 0;
      data[indexFromCoords(x,y,img.width,img.height)] = 0;
      data[indexFromCoords(x,y,img.width,img.height)] = 255;
    });
    resultimg.data = data;
    resultimg.pack().pipe(fs.createWriteStream(outpath || 'outseam.png'));
  }

  self.extractVerticalSeams = function ( numseams, startframe, inpath,
  outpath, seamsout, framesout, cb ){
    pxNum = startframe;
    getSourceImage(inpath, function(imgdata){
      var seamimg = new png({filterType: 4});
      var currentimg = new png({filterType: 4});
      var currentmap;
      seamimg.height = currentimg.height = imgdata.height;
      seamimg.width = currentimg.width = imgdata.width;
      currentimg.data = [];
      seamimg.data = [];
      for (var i = 0; i != imgdata.data.length; i+=4){
        currentimg.data.push(imgdata.data[i]);
        currentimg.data.push(imgdata.data[i+1]);
        currentimg.data.push(imgdata.data[i+2]);
        currentimg.data.push(imgdata.data[i+3]);
        seamimg.data.push(0);
        seamimg.data.push(0);
        seamimg.data.push(0);
        seamimg.data.push(0);
        // if(i%3===0) {
        //   seamimg.data.push(0);
        // } else {
        //   seamimg.data.push(255);
        // }
      }

      function processSeams (numseams, cb) {
        if(numseams > 0){
          // get seam for current image
          currentmap = getEnergyMap(currentimg);
          var seam = self.findVerticalSeam(currentmap, currentimg);
          // get new image without seam, write seam into seam image
          extractSeam(currentimg, seam, seamimg, framesout, 'v', function(){
            if(!realtime){
              currentimg.pack()
              .pipe(fs.createWriteStream(outpath || 'out.png'));

              seamimg.pack()
              .pipe(fs.createWriteStream(seamsout ||'seamsout.png'));
            }
            processSeams(numseams-1, cb);
          });
        } else {
          return cb();
        }
      };
      // for(var i = 0; i != numseams; i++){
      //
      //   console.log(Math.ceil((i/numseams)*100)+'%');
      // }
      processSeams(numseams, cb);
      // return cb();
    });
  };

  self.resize = function ( inpath, outpath, outw, outh ) {

  };

  self.findAllVerticalSeams = function ( inpath ) {

  };

  self.findAllHorizontalSeams = function ( inpath ) {

  };

  self.findVerticalSeam = function ( map, img ) {
    var solution = [];
    var w = img.width;
    var h = img.height;
    for(var y = 0; y != h; y++){
      for(var x = 0; x != w; x++){
        var best = {sum : -1, dir : null};
        if(y === 0) {
          solution.push({
            sum : map[indexFromCoords(x, y, w, h) >> 2],
            dir : 0
          });
        } else {
          for(var d = -1; d != 2; d++){
            if(!(x === 0 && d === -1) && !(x === w-1 && d === 1)){
              var current = map[indexFromCoords(x, y, w, h) >> 2] +
                        map[indexFromCoords(x+d, y-1, w, h) >> 2];
              if(current <= best.sum || best.sum < 0){
                best.sum = current;
                best.dir = d;
              }
            }
          }
          solution.push(best);
        }
      }
    }

    return constructVerticalSeam(solution, img);
  };

  self.findHorizontalSeam = function ( map ) {

  };

  var extractSeam = function ( img, seam, simg, framesout, flag, cb ) {
    // var localimg = _.clone(img);
    var w = img.width, h = img.height;
    var toRemove = [];

    function consumeSeam (seam,cb,tmpimg){
      if(seam.length > 0){
        var x = seam[0],
           y = img.height - seam.length,
           i = indexFromCoords(x, y, w, h),
           sx = Math.floor((x/w)*simg.width),
           si = indexFromCoords(sx, y, simg.width, simg.height),
           pixel = [img.data[i],img.data[i+1],img.data[i+2],img.data[i+3]];
        toRemove.push(i, i+1, i+2, i+3);
        simg.data[si] = pixel[0];
        simg.data[si+1] = pixel[1];
        simg.data[si+2] = pixel[2];
        simg.data[si+3] = pixel[3];
        if(tmpimg === null) {
          tmpimg = new png({filterType: 4});
          tmpimg.width = img.width;
          tmpimg.height = img.height;
          tmpimg.data = _.clone(img.data);
        }
        tmpimg.data[i] = 255;
        tmpimg.data[i+1] = 255;
        tmpimg.data[i+2] = 255;
        tmpimg.data[i+3] = 0;
        var filenum = pxNum.toString();
        while(filenum.length < 6){
          filenum = '0'+filenum;
        }
        if(realtime){
          renderOut(simg.data, tmpimg.data);
          consumeSeam(seam.slice(1), cb, tmpimg);
        } else {
          var wstream =fs.createWriteStream(framesout+'/frame'+filenum+'.png');
          pxNum++;
          tmpimg.pack().pipe(wstream);
          wstream.on('finish', function(){
            var sstream =
            fs.createWriteStream(framesout+'/seamsframe'+filenum+'.png');
            simg.pack().pipe(sstream);
            sstream.on('finish', function(){
              consumeSeam(seam.slice(1), cb, tmpimg);
            });
          });
        }
      } else {
        return cb();
      }
    };
    consumeSeam(seam, function(){
      toRemove.forEach(function(i){
        var row = coordsFromIndex(i, img.width, img.height)[1];
        var col = img.width%2===0? 0 : img.width;
        var splicei = indexFromCoords(row, col, img.width);
        img.data.splice(splicei, 0, 255, 255, 255, 255);
        img.data[i] = null;
      });
      img.data = _.filter(img.data, function(n){return n !== null});
      // if(flag === 'v') img.width -= 1;
      // else if(flag === 'h') img.height -=1;
      return cb();
    }, null);

  };

  var constructVerticalSeam = function ( solution, img ) {
    var seam = [];
       w = img.width;
       h = img.height;
    var best = -1;
    for(var x = 0; x != w; x++){
      if(best < 0
      || solution[indexFromCoords(x, h-1, w, h) >> 2].sum <=
      solution[indexFromCoords(best, h-1, w, h) >> 2].sum){
        best = x;
      }
    }
    // console.log(best);
    seam.unshift(best);
    for(var y = h - 2; y >= 0; y--){

      best = best + solution[indexFromCoords(best, y+1, w, h) >> 2].dir;
      seam.unshift(best);
    }
    return seam;
  };

  var getSourceImage = function ( imgpath, cb ) {
    var img = new png({filterType: 4});
    fs.createReadStream(imgpath)
      .pipe(img)
      .on('parsed', function (data) {
        return cb(img);
      });
  };

  var getEnergyMap = function ( imgdata ) {
    var result = [];
    var imgw = imgdata.width,
       imgh = imgdata.height;
    for ( var y = 0; y != imgh; y++ ) {
      for ( var x = 0; x != imgw; x++ ) {
        var i = (imgw * y + x) << 2;
        result.push(getPixelEnergy(i, imgdata));
      }
    }
    return result;
  };

  var coordsFromIndex = function ( i, w, h ){
    i = i >> 2;
    var y = Math.floor(i / w);
    var x = i % w;
    return [x, y];
  };

  var indexFromCoords = function (x, y, w){
    return (w * y + x) << 2;
  };

  var formatEnergyMap = function ( result ) {
    var maxEnergy = 780300 >> 5;
    var formattedData = [];
    result.forEach(function(energy, index){
      var scaled = Math.floor((energy/maxEnergy)*765),
         r = 0, g = 0, b = 0, a = 255;
      while(scaled > 0){
        scaled--;
        if (r < 255) r++;
        else if (g < 255) g++;
        else if (b < 255) b++;
      }
      formattedData.push(r, g, b, a);
    });
    return formattedData;
  };

  var getPixelEnergy = function ( i, id ) {
    var w = id.width,
       h = id.height;
    var ns = getNeighborhood(i, w, h);
    var rg = Math.abs(id.data[ns[0]]   - id.data[ns[1]]);
    var gg = Math.abs(id.data[ns[0]+1] - id.data[ns[1]+1]);
    var bg = Math.abs(id.data[ns[0]+2] - id.data[ns[1]+2]);
    var deltaxsq = (rg*rg) + (gg*gg) + (bg*bg);
    rg = Math.abs(id.data[ns[2]]   - id.data[ns[3]]);
    gg = Math.abs(id.data[ns[2]+1] - id.data[ns[3]+1]);
    bg = Math.abs(id.data[ns[2]+2] - id.data[ns[3]+2]);
    var deltaysq = (rg*rg) + (gg*gg) + (bg*bg);
    return deltaxsq + deltaysq;
  };

  var getNeighborhood = function ( i, w, h ) {
    var x = coordsFromIndex(i, w, h)[0];
    var y = coordsFromIndex(i, w, h)[1];
    var left = x === 0 ? w - 1 : x - 1;
    var right = x === w - 1 ? 0 : x + 1;
    var up = y === 0 ? h - 1 : y - 1;
    var down = y === h - 1 ? 0 : y + 1;
    var neighbors = [];
    neighbors.push( indexFromCoords(left, y, w),
               indexFromCoords(right, y, w),
               indexFromCoords(x, up, w),
               indexFromCoords(x, down, w));
    return neighbors;
  };

  return self;

};
