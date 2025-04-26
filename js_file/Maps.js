function generateBoundaries(currentLevelIndex, maps) {
  const boundaries = [];
  const MAP_ROWS = maps[currentLevelIndex].length; // [0] is the row
  const MAP_COLUMNS = maps[currentLevelIndex][0].length;
  canvas.width = Boundary.width * MAP_COLUMNS; //Window.innerWidth makes the canvas have the entire width of the screen
  canvas.height = Boundary.height * MAP_ROWS; // takes an entire height

  function createImage(src) {
    // images for pipes
    const image = new Image();
    image.src = src;
    return image;
  }

  maps[currentLevelIndex].forEach((row, i) => {
    row.forEach((symbol, j) => {
      switch (symbol) {
        case "-":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeHorizontal.png"),
            })
          );
          break;
        case "|":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeVertical.png"),
            })
          );
          break;
        case "1":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeCorner1.png"),
            })
          );
          break;
        case "2":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeCorner2.png"),
            })
          );
          break;
        case "3":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeCorner3.png"),
            })
          );
          break;
        case "4":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeCorner4.png"),
            })
          );
          break;
        case "b":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/block.png"),
            })
          );
          break;
        case "<":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/capLeft.png"),
            })
          );
          break;
        case ">":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/capRight.png"),
            })
          );
          break;
        case "V":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/capBottom.png"),
            })
          );
          break;
        case "_":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeConnectorBottom.png"),
            })
          );
          break;
        case "^":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/capTop.png"),
            })
          );
          break;

        case ".":
          coins.push(
            new Coin({
              position: {
                x: j * Boundary.width + Boundary.width / 2,
                y: i * Boundary.height + Boundary.height / 2,
              },
            })
          );
          break;

        case "p":
          powerUps.push(
            new PowerUp({
              position: {
                x: j * Boundary.width + Boundary.width / 2,
                y: i * Boundary.height + Boundary.height / 2,
              },
            })
          );
          break;

        case "?":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeConnectorTop.png"),
            })
          );
          break;

        case "Y":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeConnectorBottom.png"),
            })
          );
          break;

        case "+":
          boundaries.push(
            new Boundary({
              position: {
                x: Boundary.width * j,
                y: Boundary.height * i,
              },
              image: createImage("./Images/Pac_Images/pipeCross.png"),
            })
          );
          break;

        case "I":
          items.push(
            new Item({
              position: {
                x: j * Boundary.width + Boundary.width / 2,
                y: i * Boundary.height + Boundary.height / 2,
              },
              imgSrc: "./Images/Ghost_sprites/cherry.png",
            })
          );
          break;
      }
    });
  });

  return boundaries;
}
