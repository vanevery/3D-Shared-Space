/*
* 
1. how to deal with exits? 
2. where to provide entry points for customization?
3. positional audio?
*
*
*
*
*/



let all = {};
let p5l;
let groundTexture;

function preload() {
  groundTexture = loadImage("./aerial_grass_rock_diff_1k.jpg");
}

function setup() {
  createCanvas(800, 600, WEBGL);

  // Create and set up our camera
  cam = createCamera();

  // Tell p5 to use this camera
  setCamera(cam);

  // Setting "perspective matrix"
  // 4x4 matrix of numbers - position, rotation, - shift from 3d to 2d
  // field of view, aspect ratio, camera near (plane), camera (far)
  cam.perspective(PI / 3.0, width / height, 0.1, 50000);

  // position in 3d space
  cam.setPosition(0, -1, 0);
  strokeWeight(0.2);

  let constraints = {
    audio: true,
    video: true,
  };

  myVideo = createCapture(constraints, function (stream) {
    p5l = new p5LiveMedia(this, "CAPTURE", stream, "Shared Space");
    p5l.on("stream", gotStream);
    p5l.on("disconnect", gotDisconnect);
    p5l.on("data", gotData);
  });

  myVideo.elt.muted = true;
  myVideo.hide();

  // add a debug grid so we can tell where we are
  debugMode(GRID, 25, 25, 0, 0, 0);
}

function draw() {
  background(220, 230, 250);

  lights();

  // addGround();

  cameraControls();

  for (const id in all) {
    all[id].draw();
  }

  if (frameCount % 10 === 0){
    sendStats();
  }
}

function addGround() {
  // have to push and pop
  push();
  // box has height of 1 so 1/2 of that
  rotateX(Math.PI / 2);
  scale(100, 100, 100);
  // technique for achieving a repeating texture from
  // https://github.com/processing/p5.js/issues/2189
  textureWrap(REPEAT);
  texture(groundTexture);
  let u = 128,
    v = 128;
  beginShape(TRIANGLES);
  vertex(-1, -1, 0, 0, 0);
  vertex(1, -1, 0, u, 0);
  vertex(1, 1, 0, u, v);

  vertex(1, 1, 0, u, v);
  vertex(-1, 1, 0, 0, v);
  vertex(-1, -1, 0, 0, 0);
  endShape();
  pop();
}

function cameraControls() {
  // out controls
  let leftRightMove = 0,
    upDownMove = 0,
    forwardBackwardMove = 0;
  if (keyIsDown(87)) {
    forwardBackwardMove = -0.1;
  }
  if (keyIsDown(83)) {
    forwardBackwardMove = 0.1;
  }
  if (keyIsDown(65)) {
    leftRightMove = -0.1;
  }
  if (keyIsDown(68)) {
    leftRightMove = 0.1;
  }

  // move the camera along its local axes
  cam.move(leftRightMove, 0, forwardBackwardMove);
  cam.eyeY = -1.5;
  // cam.pan(leftRightMove);

}

function sendStats(){
  let cameraPosition = {
    x: cam.eyeX, // There is no x, y, z
    y: cam.eyeY,
    z: cam.eyeZ,
  };
  let cameraLookAtPoint = {
    x: cam.centerX, 
    y: cam.centerY, 
    z: cam.centerZ
  }
  let stats = {
    position: cameraPosition,
    lookAt: cameraLookAtPoint
  }
  if (p5l) {
    p5l.send(JSON.stringify(stats));
  }
}

// We got a new stream!
function gotStream(stream, id) {
  stream.hide();
  all[id] = new Avatar(stream, 0, 0, 0);
}

function mouseDragged() {
  let scaleFactor = 0.01;
  let deltaX = pmouseX - mouseX;
  let deltaY = pmouseY - mouseY;

  cam.pan(deltaX * scaleFactor);
  cam.tilt(-deltaY * scaleFactor);
}

function gotData(data, id) {
  let stats = JSON.parse(data);
  let position = stats.position;
  let lookAt = stats.lookAt;
  all[id].updatePos(position.x, position.y, position.z);
  all[id].lookAt(lookAt.x,lookAt.y,lookAt.z);
}

function gotDisconnect(id) {
  delete all[id];
}

class Avatar {
  constructor(vid, x, y, z) {
    this.updatePos(x, y, z);
    this.vid = vid;
    this.heading = 0;
  }

  updatePos(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // see example here: https://p5js.org/reference/#/p5.Vector/sub
  lookAt(x,y,z){
    let lookAt = createVector(x,z);
    let position = createVector(this.x,this.z);
    let differenceVec = p5.Vector.sub(lookAt, position);
    this.heading = -1 * differenceVec.heading();
  }

  draw() {
    push();
    translate(this.x, this.y, this.z);
    // needs a rotate - something we have to send through
    // adding Math.PI/2 (90 degrees) is a hack to ensure that we see 
    // the face rotated right-side up
    // (seems the UVs of the box are not always right-side up)
    rotateY(this.heading + Math.PI/2);
    texture(this.vid);
    box(1, 1, 1);
    pop();
  }
}
