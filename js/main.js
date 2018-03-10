const context = document.querySelector('canvas').getContext('2d');
let img = document.createElement('img');

img.src = 'image/box.png';
context.beginPath();
context.moveTo(30,30);
context.lineTo(30,90);
context.stroke();
img.addEventListener('load', (event) => {
	context.drawImage(img,0,0,20,20);
})