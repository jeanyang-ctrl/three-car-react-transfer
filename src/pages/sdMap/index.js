import React from "react";
import "./index.scss";
import * as THREE from "three";
// import styles from './index.module.css'
const vehicleColors = [
  0xa52523, 0xef2d56, 0x0ad3ff, 0xff9f1c /*0xa52523, 0xbdb638, 0x78b14b*/,
];
var camera = null;
var scene = null;
var renderer = null;
var playerCar = null;
let otherVehicles = [];
let lastTimestamp;
const lawnGreen = "#67C240";
const trackColor = "#546E90";
const edgeColor = "#725F48";
// const treeCrownColor = 0x498c2c;
// const treeTrunkColor = 0x4b3f2f;
const wheelGeometry = new THREE.BoxBufferGeometry(12, 33, 12);
const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
const config = {
  showHitZones: false,
  shadows: true,
  trees: true, // 添加树到地图
  curbs: true,
  grid: false,
};
const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;
const arcAngle1 = (1 / 3) * Math.PI; // 60 degrees
const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);
const arcCenterX =
  (Math.cos(arcAngle1) * innerTrackRadius +
    Math.cos(arcAngle2) * outerTrackRadius) /
  2;
const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);
const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);
// let ready;
// let lastTimestamp;
const playerAngleInitial = Math.PI;
let playerAngleMoved=0;
let accelerate = false; // Is the player accelerating
let decelerate = false; // Is the player decelerating
const speed = 0.0017;

function getPlayerSpeed() {
  if (accelerate) return speed * 2;
  if (decelerate) return speed * 0.5;
  return speed;
}
function movePlayerCar(timeDelta) {
  // const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= 0.001* timeDelta;
  console.log("----------------3--------------",playerAngleMoved);
  const totalPlayerAngle = playerAngleInitial + playerAngleMoved;
  const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * trackRadius;
  playerCar.position.x = playerX;
  playerCar.position.y = playerY;
  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;
}

function Wheel() {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.position.z = 6;
  wheel.castShadow = false;
  wheel.receiveShadow = false;
  return wheel;
}
function getLeftIsland() {
  const islandLeft = new THREE.Shape();

  islandLeft.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1,
    false
  );

  islandLeft.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );

  return islandLeft;
}
function getLineMarkings(mapWidth, mapHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");

  context.fillStyle = trackColor;
  context.fillRect(0, 0, mapWidth, mapHeight);

  context.lineWidth = 2;
  context.strokeStyle = "#E0FFFF";
  context.setLineDash([10, 14]);

  // Left circle
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Right circle
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}
function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getMiddleIsland() {
  const islandMiddle = new THREE.Shape();

  islandMiddle.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle3,
    -arcAngle3,
    true
  );

  islandMiddle.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI + arcAngle3,
    Math.PI - arcAngle3,
    true
  );

  return islandMiddle;
}
function getRightIsland() {
  const islandRight = new THREE.Shape();

  islandRight.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI - arcAngle1,
    Math.PI + arcAngle1,
    true
  );

  islandRight.absarc(
    -arcCenterX,
    0,
    outerTrackRadius,
    -arcAngle2,
    arcAngle2,
    false
  );

  return islandRight;
}
function getOuterField(mapWidth, mapHeight) {
  const field = new THREE.Shape();

  field.moveTo(-mapWidth / 2, -mapHeight / 2);
  field.lineTo(0, -mapHeight / 2);

  field.absarc(-arcCenterX, 0, outerTrackRadius, -arcAngle4, arcAngle4, true);

  field.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI - arcAngle4,
    Math.PI + arcAngle4,
    true
  );

  field.lineTo(0, -mapHeight / 2);
  field.lineTo(mapWidth / 2, -mapHeight / 2);
  field.lineTo(mapWidth / 2, mapHeight / 2);
  field.lineTo(-mapWidth / 2, mapHeight / 2);

  return field;
}
function getCurbsTexture(mapWidth, mapHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");

  context.fillStyle = lawnGreen;
  context.fillRect(0, 0, mapWidth, mapHeight);

  // Extra big
  context.lineWidth = 65;
  context.strokeStyle = "#A2FF75";
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1
  );
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );
  context.stroke();

  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    Math.PI + arcAngle1,
    Math.PI - arcAngle1
  );
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    arcAngle2,
    -arcAngle2,
    true
  );
  context.stroke();

  // Extra small
  context.lineWidth = 60;
  context.strokeStyle = lawnGreen;
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1
  );
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    Math.PI + arcAngle1,
    Math.PI - arcAngle1
  );
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    arcAngle2,
    -arcAngle2,
    true
  );
  context.stroke();

  // Base
  context.lineWidth = 6;
  context.strokeStyle = edgeColor;

  // Outer circle left
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Outer circle right
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Inner circle left
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Inner circle right
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}
function getCarFrontTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#666666";
  context.fillRect(8, 8, 48, 24);

  return new THREE.CanvasTexture(canvas);
}
function getCarSideTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 128, 32);

  context.fillStyle = "#666666";
  context.fillRect(10, 8, 38, 24);
  context.fillRect(58, 8, 60, 24);

  return new THREE.CanvasTexture(canvas);
}
function addVehicle() {
  console.log("-------------2-----------------");
  // const vehicleTypes = ["car", "truck"];
  const type = "car";
  const minimumSpeed = 1;
  const maximumSpeed = 2;
  const speed = minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
  const clockwise = Math.random() >= 0.5;
  const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
  const mesh = Car();
  scene.add(mesh);
  otherVehicles.push({ mesh, type, speed, clockwise, angle });
}
function Car() {
  const car = new THREE.Group();
  const color = pickRandom(vehicleColors);
  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color })
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const carFrontTexture = getCarFrontTexture();
  carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  carFrontTexture.rotation = Math.PI / 2;

  const carBackTexture = getCarFrontTexture();
  carBackTexture.center = new THREE.Vector2(0.5, 0.5);
  carBackTexture.rotation = -Math.PI / 2;

  const carLeftSideTexture = getCarSideTexture();
  carLeftSideTexture.flipY = false;

  const carRightSideTexture = getCarSideTexture();

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33, 24, 12), [
    new THREE.MeshLambertMaterial({ map: carFrontTexture }),
    new THREE.MeshLambertMaterial({ map: carBackTexture }),
    new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
    new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), // top
    new THREE.MeshLambertMaterial({ color: 0xffffff }), // bottom
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  const backWheel = new Wheel();
  backWheel.position.x = -18;
  car.add(backWheel);

  const frontWheel = new Wheel();
  frontWheel.position.x = 18;
  car.add(frontWheel);
  // if (config.showHitZones) {
  //   car.userData.hitZone1 = HitZone();
  //   car.userData.hitZone2 = HitZone();
  // }
  return car;
}

function moveOtherVehicles(timeDelta) {
  otherVehicles.forEach((vehicle) => {
    if (vehicle.clockwise) {
      vehicle.angle -= speed * timeDelta * vehicle.speed;
    } else {
      vehicle.angle += speed * timeDelta * vehicle.speed;
    }

    const vehicleX = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
    const vehicleY = Math.sin(vehicle.angle) * trackRadius;
    const rotation =
      vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);
    vehicle.mesh.position.x = vehicleX;
    vehicle.mesh.position.y = vehicleY;
    vehicle.mesh.rotation.z = rotation;
  });
}
export default class SdMap extends React.Component {
  camera = null;
  scene = null;
  renderer = null;
  playerCar = null;
  componentDidMount() {
    this.init();
  }
  render() {
    return (
      <div>
        <div id="controls" style={{ height: "600px" }}></div>
      </div>
    );
  }

  HitZone() {
    const hitZone = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 60, 30),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    hitZone.position.z = 25;
    hitZone.rotation.x = Math.PI / 2;

    this.scene.add(hitZone);
    return hitZone;
  }

  animation(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
      return;
    }
    const timeDelta = timestamp - lastTimestamp;
    movePlayerCar(timeDelta);
    console.log("----------1---------");
    const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));
    // Add a new vehicle at the beginning and with every 5th lap
    // if (otherVehicles.length < (laps + 1) / 5)  addVehicle();
    // moveOtherVehicles(timeDelta);
    // hitDetection();
    renderer.render(scene, camera);
    lastTimestamp = timestamp;
  }

  renderMap(mapWidth, mapHeight) {
    const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);

    const planeGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
    const planeMaterial = new THREE.MeshLambertMaterial({
      map: lineMarkingsTexture,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.receiveShadow = true;
    // plane.matrixAutoUpdate = false;
    this.scene.add(plane);

    // Extruded geometry with curbs
    const islandLeft = getLeftIsland();
    const islandMiddle = getMiddleIsland();
    const islandRight = getRightIsland();
    const outerField = getOuterField(mapWidth, mapHeight);
    const fieldGeometry = new THREE.ExtrudeBufferGeometry(
      [islandLeft, islandRight, islandMiddle, outerField],
      { depth: 6, bevelEnabled: false }
    );
    const curbsTexture = getCurbsTexture(mapWidth, mapHeight);
    curbsTexture.offset = new THREE.Vector2(0.5, 0.5);
    curbsTexture.repeat.set(1 / mapWidth, 1 / mapHeight);

    const fieldMesh = new THREE.Mesh(fieldGeometry, [
      new THREE.MeshLambertMaterial({
        // Either set a plain color or a texture depending on config
        // color: !config.curbs && lawnGreen,
        map: config.curbs && curbsTexture,
      }),
      new THREE.MeshLambertMaterial({ color: 0x23311c }),
    ]);
    // fieldMesh.receiveShadow = true;
    // fieldMesh.matrixAutoUpdate = false;
    this.scene.add(fieldMesh);

    // positionScoreElement();

    // if (config.trees) {
    //   const tree1 = Tree();
    //   tree1.position.x = arcCenterX * 1.3;
    //   scene.add(tree1);

    //   const tree2 = Tree();
    //   tree2.position.y = arcCenterX * 1.9;
    //   tree2.position.x = arcCenterX * 1.3;
    //   scene.add(tree2);

    //   const tree3 = Tree();
    //   tree3.position.x = arcCenterX * 0.8;
    //   tree3.position.y = arcCenterX * 2;
    //   scene.add(tree3);

    //   const tree4 = Tree();
    //   tree4.position.x = arcCenterX * 1.8;
    //   tree4.position.y = arcCenterX * 2;
    //   scene.add(tree4);

    //   const tree5 = Tree();
    //   tree5.position.x = -arcCenterX * 1;
    //   tree5.position.y = arcCenterX * 2;
    //   scene.add(tree5);

    //   const tree6 = Tree();
    //   tree6.position.x = -arcCenterX * 2;
    //   tree6.position.y = arcCenterX * 1.8;
    //   scene.add(tree6);

    //   const tree7 = Tree();
    //   tree7.position.x = arcCenterX * 0.8;
    //   tree7.position.y = -arcCenterX * 2;
    //   scene.add(tree7);

    //   const tree8 = Tree();
    //   tree8.position.x = arcCenterX * 1.8;
    //   tree8.position.y = -arcCenterX * 2;
    //   scene.add(tree8);

    //   const tree9 = Tree();
    //   tree9.position.x = -arcCenterX * 1;
    //   tree9.position.y = -arcCenterX * 2;
    //   scene.add(tree9);

    //   const tree10 = Tree();
    //   tree10.position.x = -arcCenterX * 2;
    //   tree10.position.y = -arcCenterX * 1.8;
    //   scene.add(tree10);

    //   const tree11 = Tree();
    //   tree11.position.x = arcCenterX * 0.6;
    //   tree11.position.y = -arcCenterX * 2.3;
    //   scene.add(tree11);

    //   const tree12 = Tree();
    //   tree12.position.x = arcCenterX * 1.5;
    //   tree12.position.y = -arcCenterX * 2.4;
    //   scene.add(tree12);

    //   const tree13 = Tree();
    //   tree13.position.x = -arcCenterX * 0.7;
    //   tree13.position.y = -arcCenterX * 2.4;
    //   scene.add(tree13);

    //   const tree14 = Tree();
    //   tree14.position.x = -arcCenterX * 1.5;
    //   tree14.position.y = -arcCenterX * 1.8;
    //   scene.add(tree14);
    // }
  }
  // 初始化小车到画布上
  init = () => {
    //#region 初始化相机，场景相关
    this.scene = new THREE.Scene();
    scene = this.scene;
    this.playerCar = Car();
    playerCar = this.playerCar;
    this.scene.add(playerCar);
    // Set up lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(100, -300, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.left = -400;
    dirLight.shadow.camera.right = 350;
    dirLight.shadow.camera.top = 400;
    dirLight.shadow.camera.bottom = -300;
    dirLight.shadow.camera.near = 100;
    dirLight.shadow.camera.far = 800;
    this.scene.add(dirLight);
    /**
     * 画车道
     */

    const aspectRatio = window.innerWidth / window.innerHeight;
    // 越大车越远
    const cameraWidth = 960;
    const cameraHeight = cameraWidth / aspectRatio;
    this.camera = new THREE.OrthographicCamera(
      cameraWidth / -2, // left
      cameraWidth / 2, // right
      cameraHeight / 2, // top
      cameraHeight / -2, // bottom
      50, // near plane
      700 // far plane
    );
    camera = this.camera;
    // 调整物体的摆放位置
    this.camera.position.set(0, -210, 300);
    // 改变camera的position  照相机人的视野往下看
    // camera.up.set(0, 0, 1);
    this.camera.lookAt(0, 0, 0);
    this.renderMap(cameraWidth, cameraHeight * 2); // The map height is higher because we look at the map from an angle

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer = this.renderer;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setAnimationLoop(this.animation);
    document.body.appendChild(this.renderer.domElement);
  };
}
