var spa;
var models;
var auth;

function App() {
    App.models = {};
    let addModelProp = function(name) {
        Object.defineProperty(App.models, name, {
            get() {
                const model = App.getModel(name);
                if(model !== undefined)
                    return model;
                return App.setModel(name, {});
            },
            set(value) {
                if(value instanceof Object)
                {
                    const model = value._;
                    if(model !== undefined)
                        value = model;
                }
                return App.setModel(name, value);
            }
        });
    }

    addModelProp("user");
}
App.models = {};
App.start = function() {
    try {
        //Create the app
        const options = {
            dom: {
                root: "body"
            },
            routing: {
                hashRouting: true,
                exactMatch: true
            }
        };
        spa = new SootheApp(options);
        new App();
        auth = new Auth();
        // auth.start();
    }
    catch(err) {
        App.logError(error);
        // App.displayErrorModal(err.toString());
    }
}

//========== Utility
App.logError = function(error) {
    console.log(error);
    App.setModel("error", {message: error});
}

//========= authentication
App.logIn = function() {
    try{
        return auth.signIn();
    }
    catch(error){
        App.logError(error);
    }
    
}
App.logOut = function() {
    return auth.signOut();
}
App.signedIn = function(user) {
    App.models.user = user;
    console.log("user signed in")
    console.log(user);
}
App.signedOut = function() {
    App.models.user = {name: "[LOGGED_OUT]"};
    console.log("signed out");
}

//========== Model manipulation
App.getModel = function(name) {
    return spa.getModel(name);
}
App.setModel = function(name, data){
    return spa.bindModel(name, data);
}


//============ App Screens
App.showDate = function(toggle) {
    const picker = document.querySelector(".date-picker");
    picker.classList.toggle("date-picker-active", toggle);
}
App.showSettings = function(toggle) {
    const picker = document.querySelector(".sidebar");
    picker.classList.toggle("sidebar-active", toggle);
}