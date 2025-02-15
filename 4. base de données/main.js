// reencodage de visualiser.js en utf8 sans BOM
// nbframes
// ajout traffic
//modif fitness, suppr bouton save manuelle
// ajout du l'ajax pour automatisation et db

const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

var cars = generateCars(N);
var bestCar = cars[0];
var highCar = cars[0];

if (nbTirageLeft == nbTirage) {
  discard();
}

if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, mutRate);
    }
  }
}

function generateCars(N) {
  var cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 0, 30, 50, "AI"));
  }
  return cars;
}

function findBestCar() {
  //bestCar = cars.find((c) => c.y == Math.min(...cars.map((c) => c.y)));
  let rankerCar = cars.find(
    (c) => c.score == Math.max(...cars.map((c) => c.score))
  );
  let bestScore = rankerCar.score;
  peloton = [];
  for (let i = 0; i < cars.length; i++) {
    if (cars[i].score == bestScore) {
      peloton.push(cars[i]);
    }
  }
  bestCar = peloton.find((p) => p.y == Math.min(...peloton.map((p) => p.y)));
}

function findHighCar() {
  // for camera
  highCar = cars.find((c) => c.y == Math.min(...cars.map((c) => c.y)));
}

const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2, getRandomColor()),

  new Car(road.getLaneCenter(0), -800, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -800, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -950, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -950, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(0), -1050, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -1050, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(1), -1180, 30, 50, "DUMMY", 2, getRandomColor()),
  new Car(road.getLaneCenter(2), -1180, 30, 50, "DUMMY", 2, getRandomColor()),
];

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
  localStorage.removeItem("bestBrain");
}

function infoCars() {
  let carList = [];
  for (let i = 0; i < cars.length; i++) {
    carList.push([i, cars[i].score, cars[i].y]);
  }
  carList = JSON.stringify(carList);
  return carList;
}

var temps = Date.now();
animate();

function animate(time) {
  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
    for (let j = 0; j < nbObstacles; j++) {
      let k = 2 * j;
      if (!cars[i].pastObstacles[j]) {
        if (cars[i].y < traffic[k].y) {
          nbCarsPastObstacles[j] += 1;
          cars[i].pastObstacles[j] = true;
          cars[i].score += 1;
        }
      }
    }
  }
  findBestCar();
  findHighCar();

  carCtx.save();
  carCtx.translate(0, -highCar.y + carCanvas.height * 0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx);
  }
  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx);
  }
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, true);

  carCtx.restore();

  networkCtx.lineDashOffset = -time / 50; // le parametre imvisible
  Visualizer.drawNetwork(networkCtx, bestCar.brain);

  simul.innerHTML =
    "input : " + nbSensors + " sensors - hidden : " + nbHidden + " neurones";
  tirage.innerHTML =
    "tirage " + (nbTirage - nbTirageLeft + 1) + " / " + nbTirage;
  carsLeft.innerHTML = "nb Voitures : " + nbCarsLeft + " / " + N;
  timer.innerHTML = "temps : " + (Date.now() - temps) / 1000 + " s";
  framesCount.innerHTML = nbFrames + " frames";
  distance.innerHTML =
    "distance parcourue (best car): " + Math.round(-bestCar.y) + " px";
  fitness.innerHTML = "fitness function : y (distance parcourue)";
  for (let i = 0; i < nbObstacles; i++) {
    document.getElementById("obstacle" + i).innerHTML =
      "obstacle " + i + ": " + nbCarsPastObstacles[i];
  }

  if (nbFrames < 1000) {
    nbFrames += 1;
    requestAnimationFrame(animate);
  } else {
    if (nbTirageLeft > 1) {
      save();
      // on post les valeurs de nbtTeft et nbRleft si necc, + les resultats des voitures
      let carResults = infoCars();

      info.append("nbTirageLeft", nbTirageLeft);
      info.append("carList", carResults);

      ajaxPost("db.php", info, function (reponse) {
        // Affichage dans la console en cas de succès
        console.log("Commande envoyée au serveur");
        window.location.replace("simul.php");
      });
    } else {
      if (nbRepetLeft > 1) {
        let carResults = infoCars();

        info.append("nbTirageLeft", nbTirageLeft);
        info.append("nbRepetLeft", nbRepetLeft);
        info.append("carList", carResults);

        ajaxPost("db.php", info, function (reponse) {
          // Affichage dans la console en cas de succès
          console.log("Commande envoyée au serveur");
          window.location.replace("simul.php");
        });
      } else {
        // c fini
        let carResults = infoCars();

        info.append("nbTirageLeft", nbTirageLeft);
        info.append("nbRepetLeft", nbRepetLeft);
        info.append("carList", carResults);

        ajaxPost("db.php", info, function (reponse) {
          // Affichage dans la console en cas de succès
          console.log("Commande envoyée au serveur");
          window.location.replace("result.php");
        });
      }
    }
  }
}
