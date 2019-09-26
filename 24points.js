var cardslist = document.getElementById('cards').getElementsByTagName('section');
var redraw = document.getElementById("redraw");
var step = document.getElementById("step");
var solution = document.getElementById("solution");
var input = document.getElementById('in');
var output = document.getElementById('out');
var number = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
var rank = ['C','D','H','S'];
var picked_num = [];
var picked_dict = {};
var solution_formula = "";
var one_step = "";
redraw.addEventListener("click", redraw_cards);
step.addEventListener("click", step);
solution.addEventListener("click", show_solution);
input.addEventListener("click", edit);
input.addEventListener("input", compute);

function pickem() {
    var pick_num = number[Math.floor(Math.random() * 10)];
    var pick_rank = rank[Math.floor(Math.random() * 4)];
    var name = pick_num + pick_rank;
    return name;
}
function redraw_cards() {
    picked_num = [];
    while (solve(picked_num) == "") {
        var picked = [];
        picked_num = [];
        picked_dict = {};
        input.value = "";
        output.value = "";
        for (var i = 0; i < cardslist.length; i++) {
            card = cardslist[i];
            var cur_pick = pickem();
            while (picked.includes(cur_pick)) {
                cur_pick = pickem();
            }
            picked.push(cur_pick);
            var num = cur_pick.substring(0, cur_pick.length - 1);
            if (num === 'A') {
                num = '1';
            }
            picked_num.push(num);
            if (num in picked_dict) {
                picked_dict[num] += 1;
            } else {
                picked_dict[num] = 1;
            }
            card.getElementsByTagName('img')[0].src = "../images/cards/" + cur_pick + ".png";
        }
    }
}

function edit() {
    this.setSelectionRange(0, this.value.length);
}

function compute() {
    try {
        this.setAttribute("maxlength", this.value.length + 1);
        var numlist = this.value.split(/[+-/*]+/).filter(Number);
        var optlist = this.value.split(/[0123456789()]+/).filter(n => n);
        if (numlist.length > 4) {
            this.setAttribute("maxlength", this.value.length);
            throw new Error("Entered more than 4 numbers.");
        }
        for (var i = 0; i < optlist.length; i++) {
            if (!(['/','*','+','-'].includes(optlist[i]))) {
                console.log(optlist[i]);
                this.setAttribute("maxlength", this.value.length);
                throw new Error("Not valid operator.");
            }
        }
        output.value = eval(this.value);
        if (output.value == 24) {
            var copy_dict = {};
            Object.assign(copy_dict, picked_dict);
            
            for (var i = 0; i < numlist.length; i++) {
                if (!(numlist[i] in copy_dict)) {
                    this.setAttribute("maxlength", this.value.length);
                    throw new Error(numlist[i] + " is not valid number.");
                } else {
                    if (copy_dict[numlist[i]] != 0) {
                        copy_dict[numlist[i]] -= 1;
                    } else {
                        this.setAttribute("maxlength", this.value.length);
                        throw new Error(numlist[i] + " is not valid number.");
                    }
                }
            }
            output.value = "Correct! " + input.value + "=24";
        }
    }
    catch(err) {
        output.value = err.message;
    }
}

function permutator(inputArr) {
    var results = [];
  
    function permute(arr, memo) {
      var cur, memo = memo || [];
  
      for (var i = 0; i < arr.length; i++) {
        cur = arr.splice(i, 1);
        if (arr.length === 0) {
          results.push(memo.concat(cur));
        }
        permute(arr.slice(), memo.concat(cur));
        arr.splice(i, 0, cur[0]);
      }
  
      return results;
    }
  
    return permute(inputArr);
}

function solve() {
    var nums = picked_num.map(x => parseInt(x));
    var permutation = permutator(nums);
    var operator = ['+','-','*','/'];
    for (var i = 0; i < permutation.length / 2; i++) {
        for (var a = 0; a < operator.length; a++) {
            for (var b = 0; b < operator.length; b++) {
                for (var c = 0; c < operator.length; c++) {
                    var formula1 = '(' + permutation[i][0] + operator[a] + permutation[i][1] + ')' + operator[b] + '(' + permutation[i][2] + operator[c] + permutation[i][3] + ')';
                    var formula2 = '(' + '(' + permutation[i][0] + operator[a] + permutation[i][1] + ')' + operator[b] + permutation[i][2] + ')' + operator[c] + permutation[i][3];
                    var formula3 = permutation[i][0] + operator[a] + '(' +permutation[i][1] + operator[b] + '(' + permutation[i][2] + operator[c] + permutation[i][3] + ')' + ')';
                    if (eval(formula1) === 24) {
                        console.log(formula1);
                        solution_formula = formula1;
                        return formula1;
                    }
                    if (eval(formula2) === 24) {
                        console.log(formula2);
                        solution_formula = formula2;
                        return formula2;
                    }
                    if (eval(formula3) === 24) {
                        console.log(formula3);
                        solution_formula = formula3;
                        return formula3;
                    }
                }
            }
        }
    }
    console.log("no solution");
    return "";
}

function show_solution() {
    output.value = solution_formula;
}