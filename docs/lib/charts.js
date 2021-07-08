function ChartOptions(title, width, height) {
    this.title = title;
    this.width = width;
    this.height = height;
}

function Chart(rootElement, options) {
    this.rootElement = rootElement;
    this.options = options;
}

function ChartData (label, value, color) {
    this.label = label;
    this.value = value;
    this.color = color;
}

Chart.prototype.drawPieChart = function(data) {
    this.data = data;
    let total = data.reduce((total, x) => total + Math.abs(x.value), 0);
    let size = this.options.width;
    let center = size/2;
    let diameter = size/2;
    let radius = size/4;
    let circum = 2 * Math.PI *radius;
    let progress = 0;

    let root = document.createElement("div");
    root.style = "text-align: center;";
    this.rootElement.appendChild(root);
    let namespace = "http://www.w3.org/2000/svg";
    //Clear the contents of the space
    while (root.firstChild) {
        root.removeChild(root.firstChild);
    }

    //Add title
    let title = document.createElement("h3");
    title.style = "text-align: center;"
    title.innerHTML = this.options.title;
    root.appendChild(title);

    let svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("height", size);
    svg.setAttribute("width", size);

    data.forEach(section => {
        let percentage = Math.abs(section.value) / total;
        let width = percentage * circum;
        let rotation = progress*360 - 90;
        let radians = (rotation)*Math.PI/180;
        //Create element
        let circ = document.createElementNS(namespace, "circle");
        circ.setAttribute("r", radius);
        circ.setAttribute("cx", center);
        circ.setAttribute("cy", center);
        circ.setAttribute("transform", "rotate(" + rotation + ", " + center +", " + center + ")");
        //Fill the pie slice
        circ.setAttribute("fill", "none");
        circ.setAttribute("stroke", section.color);
        circ.setAttribute("stroke-width", diameter);
        circ.setAttribute("stroke-dasharray", width + " " + circum);
        //Add slice
        let text = document.createElementNS(namespace, "text");
        let x = center + radius/2;
        let y = center;
        text.innerHTML = section.label;// + " " + (percentage*100).toFixed(2) + "%";
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("transform", "rotate(" + (rotation + percentage*360/2) + ", " + center +", " + center + ")");
        svg.appendChild(circ);
        svg.appendChild(text);
        //
        progress += percentage;
    });
    root.appendChild(svg);

    let legendTitle = document.createElement("h4");
    legendTitle.style = "text-align: left;";
    legendTitle.innerHTML = "Legend";
    root.appendChild(legendTitle);

    let legend = document.createElement("div");
    
    legend.style = "display: flex;flex-wrap:wrap;";
    data.forEach(section => {
        let percentage = (Math.abs(section.value) / total*100).toFixed(2);
        let container = document.createElement("div");
        container.style = "display: flex;padding:5px;";
        let box = document.createElement("div");
        box.style = "max-width:20px;min-width: 20px;max-height:20px;min-height: 20px;background-color: " + section.color + ";"
        let text = document.createElement("span");
        text.style = "padding-left: 5px;"
        text.innerHTML = section.label + " (" + section.value + ") " + percentage + "%"
        container.appendChild(box);
        container.appendChild(text);
        legend.appendChild(container);
    });
    root.appendChild(legend);
}