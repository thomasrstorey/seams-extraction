window.onload = function () {
  var imgsize = 960;
  var img = new Image(imgsize, imgsize),
     canvas = document.getElementById('canvas'),
     tmpcanvas = document.createElement('canvas'),
     orig,
     gray,
     grad,
     carved,
     seams,
     done = false;
  var cmat,
     pmat;

  var seam = null;
  var imgs = ['out1.png','out2.png','out3.png','out4.png','out5.png',
          'out6.png','out7.png','out8.png','out9.png','out10.png','out11.png',
          'out12.png','out13.png','out14.png','out15.png','out16.png',
          'out17.png','out18.png','out19.png','out20.png','out21.png',
          'out22.png','out23.png','out24.png','out25.png','out26.png',
          'out27.png'];

  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = canvas.width/2;
  }

  window.addEventListener('resize', handleResize);

  var requestAnimationFrame = window.requestAnimationFrame;

  init('img/out0.png', function(){
    requestAnimationFrame(carve);
  });

  function init (path, cb) {
    img.src = path;

    img.addEventListener("load", function onLoad () {
      console.log("LOAD");
      canvas.width = window.innerWidth;
      canvas.height = canvas.width/2;
      tmpcanvas.width = imgsize;
      tmpcanvas.height = imgsize;
      var ctx = canvas.getContext('2d');
      var tmpctx = tmpcanvas.getContext('2d');
      tmpctx.drawImage(img, 0, 0);

      orig = tmpctx.getImageData(0, 0, img.width, img.height);

      ctx.globalCompositeOperation = 'destination-over';
      ctx.clearRect(0,0,canvas.width,canvas.height);

      gray = new ImageData(img.width, img.height);
      grad = new ImageData(img.width, img.height);
      carved = new ImageData(img.width-1, img.height);
      seams = new ImageData(img.width, img.height);
      if(cb){
        cb();
      }
    });
  }

  function carve (ts) {
    // seam is array of pixel coords to remove
    renderToCanvas();

    if(!seam) {
      seam = findVerticalSeam();
    }
    moveNext(seam);
    // consume(seam);

    if(!seam.length){
      if(done){
        console.log("DONE");
        done = false;
        seam = null;
        saveCanvasToDisk(canvas);
        init('img/'+imgs.shift());
        return;
      } else {
        updateOriginal();
        seam = null;
      }
    }
    if(orig.width > 0) {
      requestAnimationFrame(carve);
    }
  }

  function saveCanvasToDisk(cvs){
    var dataURL = cvs.toDataURL("image/png");
    var data = window.atob(dataURL.substring("data:image/png;base64,".length));
    var asArray = new Uint8Array(data.length);
    for(var i = 0; i < data.length; ++i){
      asArray[i] = data.charCodeAt(i);
    }
    var blob = new Blob([asArray.buffer], {type: "image/png"});
    saveAs(blob, "carved_"+imgs[0]);
  }

  function renderToCanvas () {
    var ctx = canvas.getContext('2d');
    var tmpctx = tmpcanvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // render orig ImageData to left half of canvas
    tmpctx.clearRect(0,0,tmpcanvas.width,tmpcanvas.height);
    tmpctx.putImageData(orig, (img.width-orig.width)/2, 0);
    ctx.drawImage(tmpcanvas, 0, 0, canvas.width/2, canvas.height);

    // render seams ImageData to right half of canvas
    tmpctx.clearRect(0,0,tmpcanvas.width,tmpcanvas.height);
    tmpctx.putImageData(seams, 0, 0);
    ctx.drawImage(tmpcanvas, canvas.width/2, 0, canvas.width/2, canvas.height);

  }

  function convertToGrayscale () {
    for(var x = 0; x != orig.width; ++x){
      for(var y = 0; y != orig.height; ++y){
        var pixel = getPixel(orig, x, y);
        var avg = Math.floor((pixel[0] + pixel[1] + pixel[3]) / 3);
        setPixel(gray, x, y, [avg, avg, avg, 255]);
      }
    }
  }

  function findGradient () {
    convertToGrayscale();
    for (var x = 0; x != orig.width; ++x){
      for (var y = 0; y != orig.height; ++y){
        var here = getPixel(gray, x, y)[0];
        var left = x > 0 ? getPixel(gray, x-1, y)[0] : here;
        var above = y > 0 ? getPixel(gray, x, y-1)[0] : here;
        var dx = left - here;
        var dy = above - here;
        var mag = Math.sqrt(dx*dx + dy*dy) * 255 / 361;
        setPixel(grad, x, y, [mag, mag, mag, 255]);
      }
    }
  }

  function findVerticalSeam () {
    if(orig.width === 1){
      var seam = [],
         y = orig.height - 1;
      while(y >= 0){
        seam[y] = 0;
        y--;
      }
      return seam;
    }
    findGradient();
    initMatrices();
    for(var y = 0; y != orig.height; ++y){
      for(var x = 0; x != orig.width; ++x){
        if(y == 0){
          cmat[x][y] = getEnergy(x, y);
          continue;
        }

          var parents = getParents(x, y);
          var minCost = parents[0].cost;
          parents.forEach(function(p){
            minCost = (p.cost < minCost) ? p.cost : minCost;
          });
          cmat[x][y] = minCost + getEnergy(x, y);
          parents.forEach(function(p){
            if(minCost === p.cost) {
              pmat[x][y].push(p);
            }
          });
      }
    }

    var bottom = orig.height - 1,
       minCost = cmat[0][bottom],
       minX = 0;
    for(var x = 0; x != orig.width; ++x) {
      var cost = cmat[x][bottom];
      if(cost < minCost) {
        minCost = cost;
        minX = x;
      }
    }
    return constructSeam(minX);
  }

  function constructSeam (x) {
    var seam = [],
       y = orig.height-1,
       p = null;
    while (y > 0) {
      seam[y] = x;
      var ps = pmat[x][y];
      if (ps.length) p = ps[0];
      else { break; }
      x = p.x;
      y = p.y;
    }
    seam[y] = x;
    return seam;
  }

  function updateOriginal () {
    // set orig data to carved data
    orig = new ImageData(carved.data, carved.width, carved.height);
    if(orig.width > 1){
      carved = new ImageData(orig.width-1, orig.height);
      gray = new ImageData(orig.width, orig.height);
      grad = new ImageData(orig.width, orig.height);
    } else {
      done = true;
    }

  }

  function moveNext (seam){
    var y = orig.height - seam.length,
       sx = seam.shift();
    for(var x = 0; x != orig.width; ++x){
      var offset = x < sx ? x : x - 1;
      if(x === sx){
        // set pixel in seams image (to display)
        setPixel(seams, x, y, getPixel(orig, x, y));
        // set pixel in original (to display)
        setPixel(orig, x, y, [255, 255, 255, 255]);
      } else {
        var op = getPixel(orig, x, y);
        // set pixel in carved image (new original after seam is complete)
        setPixel(carved, offset, y, op);
        // set pixel in original (to display)
        setPixel(orig, x, y, op);
      }
    }
  }

  function consume (seam){
    while(seam.length){
      moveNext(seam);
    }
  }

  function getParents (x, y) {
    function p (x){
      return {x:x, y:y-1, cost:cmat[x][y-1]};
    }
    if(y==0){
      // top
      return [];
    } else if(x==0){
      // left
      return [p(x+1),p(x)];
    } else if(x == orig.width-1){
      // right
      return [p(x-1),p(x)];
    } else {
      return [p(x-1),p(x+1),p(x)];
    }
  }

  function getEnergy (x, y) {
    var p = getPixel(grad, x, y);
    return p[0];
  }

  function getPixel (image, x, y){
    var i = (y*image.width+x)*4;
    return [image.data[i], image.data[i+1], image.data[i+2], image.data[i+3]];
  }

  function setPixel (dest, x, y, pixel) {
    var i = (y*dest.width+x)*4;
    dest.data[i] = pixel[0];
    dest.data[i+1] = pixel[1];
    dest.data[i+2] = pixel[2];
    dest.data[i+3] = pixel[3];
  }

  function initMatrices () {
    cmat = [];
    pmat = [];
    for(var x = 0; x != orig.width; ++x){
      cmat[x] = [];
      pmat[x] = [];
      for(var y = 0; y != orig.height; ++y) {
        cmat[x][y] = 0;
        pmat[x][y] = [];
      }
    }
  }
};
