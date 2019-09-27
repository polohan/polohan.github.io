var cardslist = document.getElementById('cards').getElementsByTagName('section');
var redraw = document.getElementById("redraw");
var step = document.getElementById("step");
var solution = document.getElementById("solution");
var input = document.getElementById('in');
var output = document.getElementById('out');
var res0 = document.getElementById('res0');
var res1 = document.getElementById('res1');
var pick0 = document.getElementById('pick0');
var pick1 = document.getElementById('pick1');
var operator_buttons = document.querySelectorAll("li > div > button")
var number = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
var rank = ['C','D','H','S'];
var picked_num = [];
var picked_dict = {};
var solution_formula = "";
var one_step = "";
redraw.addEventListener("click", redraw_cards);
step.addEventListener("click", show_step);
solution.addEventListener("click", show_solution);
input.addEventListener("click", edit);
input.addEventListener("input", compute);
pick0.addEventListener("click", pick_reset);
pick1.addEventListener("click", pick_reset);
res0.addEventListener("click", res_pick);
res1.addEventListener("click", res_pick);
for (var i = 0; i < 4; i++) {
    cardslist[i].addEventListener("click", pick);
    operator_buttons[i].addEventListener("click", operate);
}
operator_buttons[4].addEventListener("click", reset);

function pickem() {
    var pick_num = number[Math.floor(Math.random() * 10)];
    var pick_rank = rank[Math.floor(Math.random() * 4)];
    var name = pick_num + pick_rank;
    return name;
}
function redraw_cards() {
    reset();
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
            card.getElementsByTagName('img')[0].setAttribute('data-num', num);
            card.getElementsByTagName('img')[0].setAttribute('data-rank', cur_pick[cur_pick.length - 1]);
            card.getElementsByTagName('img')[0].setAttribute('data-pick', 'True');
        }
    }
}

function edit() {
    this.setSelectionRange(0, this.value.length);
}

function compute() {
    try {
        this.setAttribute("maxlength", this.value.length + 1);
        var numlist = this.value.split(/[()+-/*]+/).filter(Number);
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
                    var step1 = '(' + permutation[i][0] + operator[a] + permutation[i][1] + ')';
                    var formula2 = '(' + '(' + permutation[i][0] + operator[a] + permutation[i][1] + ')' + operator[b] + permutation[i][2] + ')' + operator[c] + permutation[i][3];
                    var step2 = '(' + permutation[i][0] + operator[a] + permutation[i][1] + ')';
                    var formula3 = permutation[i][0] + operator[a] + '(' +permutation[i][1] + operator[b] + '(' + permutation[i][2] + operator[c] + permutation[i][3] + ')' + ')';
                    var step3 = '(' + permutation[i][2] + operator[c] + permutation[i][3] + ')';
                    if (eval(formula1) === 24) {
                        solution_formula = formula1;
                        one_step = step1;
                        return formula1;
                    }
                    if (eval(formula2) === 24) {
                        solution_formula = formula2;
                        one_step = step2;
                        return formula2;
                    }
                    if (eval(formula3) === 24) {
                        solution_formula = formula3;
                        one_step = step3;
                        return formula3;
                    }
                }
            }
        }
    }
    return "";
}

function show_solution() {
    if (solution_formula == "") {
        output.value = "Draw the cards first to see the solution!";
    } else {
        input.value = "";
        output.value = solution_formula;
    }
}

function show_step() {
    if (one_step == "") {
        output.value = "Draw the cards first to see the hint!";
    } else {
        input.value = one_step;
        output.value = eval(one_step);
    }
}

function pick() {
    if (this.getElementsByTagName('img')[0].getAttribute("data-pick") == 'False') {
        return;
    }
    var color = this.getElementsByTagName('img')[0].getAttribute("data-color");  
    if (pick0.value == "") {
        pick0.value = this.getElementsByTagName('img')[0].getAttribute('data-num');
        pick0.setAttribute('data-pos', this.id[this.id.length - 1]); 
        pick0.setAttribute('data-pick', 'True');
        this.getElementsByTagName('img')[0].src = "../images/cards/" + color + "_back.png";
        this.getElementsByTagName('img')[0].setAttribute('data-pick', 'False');
    }
    else if (pick1.value == "") {
        pick1.value = this.getElementsByTagName('img')[0].getAttribute('data-num');
        pick1.setAttribute('data-pos', this.id[this.id.length - 1]);
        pick1.setAttribute('data-pick', 'True');
        this.getElementsByTagName('img')[0].src = "../images/cards/" + color + "_back.png";
        this.getElementsByTagName('img')[0].setAttribute('data-pick', 'False');
    }
    else {
        output.value = "Already picked two number.";
    }
}

function operate() {
    if (pick0.value == "" || pick1.value == "") {
        output.value = "Pick two number first.";
    } else {
        var fst = pick0.getAttribute('data-formula') || pick0.value;
        var sec = pick1.getAttribute('data-formula') || pick1.value;
        var result = '(' + fst + this.innerText + sec + ')';
        pick0.value = pick1.value = "";
        
        pick0.setAttribute('data-pick', 'False');
        pick1.setAttribute('data-pick', 'False');
        pick0.setAttribute('data-formula', '');
        pick1.setAttribute('data-formula', '');
        if (res0.value == "") {
            res0.value = eval(result);
            res0.setAttribute('data-pick', 'True');
            res0.setAttribute('data-formula', result);
            input.value = result;
            if (result.split(/[()+-/*]+/).filter(Number).length == 4) {
                if (eval(result) == '24') {
                    output.value = "Correct! " + result + "=24";
                    res0.setAttribute('data-pick', 'False');
                } else {
                    reset();
                    output.value = "You got " + eval(result) + " , try again.";
                }
            } else {
                output.value = res0.value;
            }
            
        } else {
            res1.value = eval(result);
            res1.setAttribute('data-pick', 'True');
            res1.setAttribute('data-formula', result);
        }
    }
}
function reset_card(i) {
    var card = cardslist[i].getElementsByTagName('img')[0];
    var num = card.getAttribute('data-num');
    if (num == '1') {
        num = 'A';
    }
    var num_rank = num + card.getAttribute('data-rank');
    card.src = "../images/cards/" + num_rank + ".png";
    card.setAttribute('data-pick', 'True');
}

function reset() {
    if (solution_formula == "") {
        return;
    }
    res0.value = res1.value = pick0.value = pick1.value = "";
    var temp_list = [res0, res1, pick0, pick1];
    for (var i = 0; i < 4; i++) {
        reset_card(i);
        temp_list[i].setAttribute('data-pick', 'False');
        temp_list[i].setAttribute('data-formula', '');
    }
}

function pick_reset() {
    if (this.getAttribute('data-pick') == 'False') {
        return;
    }
    this.setAttribute('data-pick', 'False');
    var pos = this.getAttribute('data-pos');
    if (pos >= 0) {
        reset_card(pos);
        this.value = "";
    } else {
        if (pos == -1) {
            res0.value = this.value;
            res0.setAttribute('data-pick', 'True');
            this.value = "";
        } else if (pos == -2) {
            res1.value = this.value;
            res1.setAttribute('data-pick', 'True');
            this.value = "";
        }
    }
}

function res_pick() {
    if (this.getAttribute('data-pick') == 'False') {
        return;
    }
    this.setAttribute('data-pick', 'False');
    if (pick0.value == "") {
        pick0.value = this.value;
        pick0.setAttribute('data-pos', -1-this.id[this.id.length - 1]); 
        pick0.setAttribute('data-pick', 'True');
        pick0.setAttribute('data-formula', this.getAttribute('data-formula'));
        this.value = "";
    }
    else if (pick1.value == "") {
        pick1.value = this.value;
        pick1.setAttribute('data-pos', -1-this.id[this.id.length - 1]);
        pick1.setAttribute('data-pick', 'True');
        pick1.setAttribute('data-formula', this.getAttribute('data-formula'));
        this.value = "";
    }
    else {
        output.value = "Already picked two number.";
    }
}