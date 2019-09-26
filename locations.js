// var numOne = document.getElementById("num-one");
// var numTwo = document.getElementById("num-two");
// var addSum = document.getElementById("add-sum");

// numOne.addEventListener("input", add);
// numTwo.addEventListener("input", add);

// function add() {
//   var one = parseFloat(numOne.value) || 0;
//   var two = parseFloat(numTwo.value) || 0;
  
//   addSum.innerHTML = "your sum is: " + (one+two);
// }

var checklist = document.getElementById("checklist");
var items = checklist.getElementsByTagName('li');
var inputs = checklist.getElementsByTagName('input');

for (var i = 0; i < items.length; i++) {
  items[i].addEventListener("click", editItem);
  inputs[i].addEventListener("blur", updateItem);
  inputs[i].addEventListener("keypress", itemKeypress);
}

function editItem() {
  this.className = "edit";
  var input = this.querySelector("input");
  input.focus();
  input.setSelectionRange(0, input.value.length);
}

function updateItem() {
  this.previousElementSibling.innerHTML = this.value;
  this.parentNode.className = "";
}

function itemKeypress(event) {
  if (event.which === 13) {
    updateItem.call(this);
  }
}