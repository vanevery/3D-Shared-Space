let all = {};
let angle = 0.0;
let p5l;
let avatarSize = 50;

function setup() {
  createCanvas(400, 400, WEBGL);
  
  let constraints = {audio: true, video: true};
  myVideo = createCapture(constraints, 
    function(stream) {
	  p5l = new p5LiveMedia(this, "CAPTURE", stream, "New Shared Space")
	  p5l.on('stream', gotStream);
      p5l.on('disconnect', gotDisconnect);
      p5l.on('data', gotData);
    }
  );  
  myVideo.elt.muted = true;     
  myVideo.hide();
  all['me'] = new Avatar(myVideo,random(width),random(height));
}

function draw() {
  background(220);
  rotateX(angle);
  rotateY(angle);
  
  for (const id in all) {
    all[id].draw();
  }
  //camera(all['me'].x,all['me'].y,all['me'].z);
  //angle+=0.01;
}

// We got a new stream!
function gotStream(stream, id) {
  stream.hide();
  all[id] = new Avatar(stream, 0, 0);
}

function mousePressed() {
  myPos = {x: (mouseX - width/2), y: (mouseY - height/2)};
  print(myPos);
  p5l.send(JSON.stringify(myPos));
  all['me'].updatePos((mouseX - width/2), (mouseY - height/2));
}

function mouseDragged() {
  myPos = {x: (mouseX - width/2), y: (mouseY - height/2)};
  print(myPos);
  p5l.send(JSON.stringify(myPos));
  all['me'].updatePos((mouseX - width/2), (mouseY - height/2));
}

function gotData(pos, id) {
  print(pos);
  newPos = JSON.parse(pos);
  all[id].updatePos(newPos.x,newPos.y);
}

function gotDisconnect(id) {
 delete all[id]; 
}

class Avatar {
  constructor(vid,x,y) {
    this.updatePos(x,y);
    this.vid = vid;
  }
  
  updatePos(x,y) {
    this.x = x;
    this.y = y;
    this.z = 0;
  }
  
  draw() {
    // Body
    translate(this.x, this.y+avatarSize, 0);
    box(avatarSize/2, avatarSize*2, avatarSize/2);
    translate(-this.x, -this.y-avatarSize, 0);

    // Head
    translate(this.x, this.y, 0);
    box(avatarSize, avatarSize, avatarSize);
    translate(-this.x,-this.y,0);
    texture(this.vid); // How do you turn this off?

  }
}
