function MeganMoneyView(name) {
    this.name = name;
    SootheView.call(this);
}
MeganMoneyView.prototype = Object.create(SootheView.prototype);
MeganMoneyView.prototype.getTitle = function() {
    return 'MeganMoney | ' + this.name;
}
MeganMoneyView.prototype.getRoot = function() {
    return document.querySelector(".main-content");
}
MeganMoneyView.prototype.processData = function(data) {
    App.models.page.data = data;
}
MeganMoneyView.prototype.getRoute = function() {
    return "#";
}
MeganMoneyView.prototype.startRendering = function() {
    App.displayWaitingModal();
    
    const tabName = this.name.toLowerCase();
    //Update selected tab
    Object.keys(App.models.page.tabs).forEach(x => {
        App.models.page.tabs[x].selected = x === tabName;
    });
}
MeganMoneyView.prototype.finishRendering = function(error) {
    if(!error) {
        App.dismissModals();
        App.models.page.loading = false;
    }
    else {
        App.displayErrorModal(error.message);
        App.models.page.loaded = false;
        console.error(error);
    }
}




//============ Login ===========//
function LoginView() {
    MeganMoneyView.call(this, "Login");
}
LoginView.prototype = Object.create(MeganMoneyView.prototype);
LoginView.prototype.getRoute = function() {
    return "#login";
}
LoginView.prototype.getHTML = function() {
    return fetch("views/home/login.html");
}

//============ Dashboard ============//
function DashboardView() {
    MeganMoneyView.call(this,"Dashboard");
}
DashboardView.prototype = Object.create(MeganMoneyView.prototype);
DashboardView.prototype.getRoute = function() {
    return "#dashboard";
}
DashboardView.prototype.getHTML = function() {
   return fetch("views/dashboard/index.html");
}

//============ Labels ============//
function LabelsView() {
    MeganMoneyView.call(this,"Labels");
}
LabelsView.prototype = Object.create(MeganMoneyView.prototype);
LabelsView.prototype.getRoute = function() {
    return "#labels";
}
LabelsView.prototype.getHTML = function() {
   return fetch("views/labels/index.html");
}
LabelsView.prototype.getData = function(req, res) {
    return Storage.getLabels()
    .then(res => {
        res.forEach(x => {
            const route = LabelsEditView.prototype.getRoute(x.id);
            x.edit = function() {
                console.log(route);
                window.location = route;
            };
        });
        return {
            labels: res
        };
    });
}

function LabelsEditView() {
    MeganMoneyView.call(this,"Labels");
}
LabelsEditView.prototype = Object.create(MeganMoneyView.prototype);
LabelsEditView.prototype.getRoute = function(id) {
    return LabelsView.prototype.getRoute() + "edit/" + (id === undefined ? ":id" : id);
}
LabelsEditView.prototype.getHTML = function() {
   return fetch("views/labels/edit.html");
}
LabelsEditView.prototype.getData = function(req) {
    return Storage.getLabels()
    .then(res => {
        return {
            label:  res.filter(x => x.id == req.params.id)[0]
        };
    });
}