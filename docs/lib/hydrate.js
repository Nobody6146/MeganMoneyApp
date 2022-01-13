/*
    With Hydrate, you can bring life to your static web page by utilizing dynamic data and reactive components.
    Powerful features like 2-way modeling binding and client-side routing come out of the box.
*/
//******** Options *******//
/** Options for Hydrate DOM manipulation */
class HydrateDOMOptions {
    root;
    attributePrefix;
    attributes;
    constructor() {
        this.root = "body";
        this.attributePrefix = "h";
        this.attributes = new HydrateHTMLAttributeOptions();
    }
}
class HydrateHTMLAttributeOptions {
    //Basic
    model = "model";
    //Basic element manipulation
    property = "property";
    attribute = "attribute";
    toggle = "toggle"; //Toggles an attribute
    class = "class"; //Toggles the inclusion of a class to an element
    delete = "delete"; //removes an element
    //Binding
    input = "input";
    //Conditionals
    event = "event";
    static = "static"; //Executes once
    condition = "condition";
    discrete = "discrete"; //Only allow discrete prop binding meaning "won't respond to generic wildcard events" def="model|prop|true|false", defaults to true
    //Functions and execution
    callback = "callback"; //Calls a property function
    handler = "handler"; //Fires a callback when the "on" event of the element is fired
    //init = "init"; //Create's the model if it doesn't exist of the name, retrieves it, then fires the code inside if any. Sets to true if ran. Runs first time initialized
    function = "function";
    script = "script"; //Sets a model property equal to the innerText of the element
    //Templating and Components
    expression = "expression";
    template = "template"; //template changes queries user of the templates then regenerate
    component = "component"; //="[PROP] [TEMPLATE] [property | model | array | dictionary | map]?"
    append = "append"; //Tells a component to append a value rather than replace it
    //Execution manipulation
    repeat = "repeat";
}
/** Options for Hydrate routing */
class HydrateRouterOptions {
    hashRouting;
    exactMatch;
    constructor() {
        this.hashRouting = true;
        this.exactMatch = true;
    }
}
class HydrateModelOptions {
    stateProperty;
    nameProperty;
    wildcardOperator;
    insertionOperator;
    nestedOperator;
    constructor() {
        this.stateProperty = "__state";
        this.nameProperty = "__name";
        this.wildcardOperator = "*";
        this.insertionOperator = "_";
        this.nestedOperator = ".";
    }
}
/** Hydrate app options */
class HydrateAppOptions {
    dom;
    router;
    models;
    constructor() {
        this.dom = new HydrateDOMOptions();
        this.router = new HydrateRouterOptions();
        this.models = new HydrateModelOptions();
    }
}
class HydrateModelEvent {
    app;
    target;
    type;
    model;
    modelName;
    rootModelName;
    state;
    previousState;
    propName;
    propFullName;
    prop;
    constructor(type, model, previousState, propName, target, app, modelName) {
        this.app = app;
        this.target = target;
        this.type = type;
        this.model = model;
        this.modelName = app.name(model) ?? modelName;
        this.rootModelName = this.modelName != null
            ? this.modelName.split(app.options.models.nestedOperator)[0]
            : undefined;
        this.state = app.state(model) ?? model;
        this.previousState = previousState;
        this.propName = propName;
        this.propFullName = (this.modelName != null && this.propName != null)
            ? this.modelName + app.options.models.nestedOperator + this.propName
            : undefined;
        this.prop = (typeof this.state === 'object')
            ? this.state[this.propName]
            : undefined;
    }
}
//****************//
class HydrateDomAttributeArguments {
    arg1;
    arg2;
    arg3;
    constructor(arg1, arg2, arg3) {
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
    }
}
class HydrateDomUpdateAttributes {
    model;
    attribute;
    property;
}
//****************//
class HydrateApp {
    #models;
    #eventListeners;
    #observer;
    options;
    constructor(options) {
        this.options = options ?? new HydrateAppOptions();
        this.#models = new Map();
        this.#eventListeners = new Map();
        //Start the dom
        this.#observer = new MutationObserver(this.#mutationCallback.bind(this));
        this.#observer.observe(this.root, { childList: true, attributes: true, attributeFilter: Object.keys(this.options.dom.attributes).map(x => this.attribute(x)), subtree: true });
        this.root.addEventListener("input", this.#inputListener.bind(this));
        //Start the router
        // this.root.addEventListener("click", this.routeListener.bind(this));
        // window.addEventListener("popstate", this.historyListener.bind(this));
    }
    //=============== Helpful methods ==============/
    /** Gets the root element the app is attached to */
    get root() {
        return document.querySelector(this.options.dom.root);
    }
    /** Gets the full directive name for the HTML attribute */
    attribute(name) {
        return `${this.options.dom.attributePrefix}-${name}`;
    }
    /** Makes a copy of a JS object */
    copy(value) {
        return JSON.parse(JSON.stringify(value));
    }
    //******** Basic model methods ********//
    /** Returns a list of the models bound to the framework */
    get models() {
        return [...this.#models.values()];
    }
    /** Retrieves the model resulting from the search. Search can be a string (name of model) or the state of the model */
    model(search) {
        if (search === undefined)
            return undefined;
        let model;
        let name;
        if (typeof search === "string") {
            model = this.#getRootModel(search);
            name = search;
        }
        else {
            model = search;
            name = this.name(search);
        }
        if (name === undefined || model === undefined)
            return undefined;
        const nameParts = name.split(this.options.models.nestedOperator);
        if (nameParts.length === 0)
            //We asked for a root model and found it    
            return model;
        for (let i = 1; i < nameParts.length; i++) {
            model = model[nameParts[i]];
            //If we can't dive any further but we haven't reached our model, then it doesn't exist
            if (model == null && i < nameParts.length + 1)
                return undefined;
        }
        return model;
    }
    /** Retrieves the state associated with the search. Search can be a string (name of model) or the state of the model */
    state(search) {
        let model = (typeof search === "object")
            ? search : this.model(search);
        if (model == null)
            return model;
        return model[this.options.models.stateProperty];
    }
    /** Gets the model name of the search. Search can be a string (name of model) or the state of the model */
    name(search) {
        if (name === undefined)
            return undefined;
        let model = (typeof search === "object")
            ? search : this.model(search);
        if (model == null)
            return undefined;
        return model[this.options.models.nameProperty];
    }
    /** Bind a new model to the framework */
    bind(name, state) {
        if (name == null)
            name = "";
        if (state == null)
            state = {};
        //If this model already exist, unbind it first
        if (this.#models.get(name) != undefined)
            this.unbind(name);
        let proxy = this.#makeProxy(state, name);
        this.#models.set(name, proxy);
        this.dispatch("bind", proxy, undefined, undefined, this.root);
        return proxy;
    }
    /** Unbinds the model from the framework related to the search. Search can be a string (name of model) or the state of the model */
    unbind(search) {
        let model;
        let name;
        if (typeof search === "string") {
            model = this.model(search);
            name = search;
        }
        else {
            model = search;
            name = this.name(search);
        }
        let nameParts = name.split(this.options.models.nestedOperator);
        const rootModelName = nameParts[0];
        this.#models.delete(rootModelName);
        this.dispatch("unbind", model, undefined, this.state(model), this.root);
    }
    //******** Basic model methods ********//
    /** Adds an even listener for the following events */
    listen(search, handler) {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if (name == null)
            return null;
        let listeners = this.#eventListeners.get(name);
        if (listeners === undefined) {
            listeners = [];
            this.#eventListeners.set(name, listeners);
        }
        if (listeners.includes(handler))
            return handler;
        listeners.push(handler);
        return handler;
    }
    /** Removes an event listener */
    unlisten(search, handler) {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if (name == null)
            return null;
        const listeners = this.#eventListeners.get(name);
        if (listeners == null)
            return null;
        let index = listeners.indexOf(handler);
        if (index === -1)
            return;
        listeners.splice(index, 1);
    }
    //******** Advance features methods ********//
    /** Generates and dispatches events and sends it to HTML and listeners */
    dispatch(type, model, propName, previousState, target) {
        console.log(`${type} ${JSON.stringify(model)} ${propName} ${JSON.stringify(previousState)} ${target}`);
        if (target == null)
            target = this.root;
        const attribute = this.attribute(this.options.dom.attributes.model);
        //Get the DOM elements subscriped for model events
        let listeningElements = [...this.root.querySelectorAll(`[${attribute}]`)];
        let eventListeners = [...this.#eventListeners.keys()];
        //Figure out all the models we're subscribed to
        const searchKeys = listeningElements.map(x => x.attributes[attribute].value)
            .concat(eventListeners);
        //Determine all the base handlers to notify (using a distinct list)
        let eventMappings = new Map();
        [...new Set(searchKeys)].forEach(key => {
            eventMappings.set(key, this.#generateEvents(type, target, this.name(model), model, propName, key, previousState));
        });
        //Fire all the event handlers
        eventListeners.forEach(key => {
            let events = eventMappings.get(key);
            if (events == null)
                return;
            this.#eventListeners.get(key).forEach(handler => {
                events.forEach(event => {
                    handler(event);
                });
            });
        });
        //Trigger all the DOM updates
        listeningElements.forEach(element => {
            let events = eventMappings.get(element.attributes[attribute].value);
            if (events == null)
                return;
            events.forEach(event => {
                this.#dom(event, element);
            });
        });
    }
    //====================
    /** Search can be a string (name of model) or the state of the model */
    #getRootModel(search) {
        let model;
        let name;
        let nameParts;
        if (typeof search === "string") {
            nameParts = search.split(this.options.models.nestedOperator);
            model = this.#models.get(nameParts[0]);
            if (model == null)
                return undefined;
            name = search;
        }
        else {
            name = this.name(search);
            if (name == null)
                return undefined;
            nameParts = name.split(this.options.models.nestedOperator);
            model = this.#models.get(nameParts[0]);
            if (model == null)
                return undefined;
        }
        return model;
    }
    //Internal
    #makeProxy(data, name) {
        const app = this;
        let models = {};
        let proxy;
        let bindOrGet = function (obj, prop) {
            if (obj[prop] instanceof Date || !(obj[prop] instanceof Object))
                return null;
            let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
            let modelName = name + "." + propName;
            let model = models[prop];
            if (model !== undefined)
                return model;
            else {
                //Make proxy
                models[prop] = app.#makeProxy(obj[prop], modelName);
                return models[prop];
            }
        };
        proxy = new Proxy(data, {
            get(obj, prop) {
                if (prop === app.options.models.stateProperty)
                    return obj;
                if (prop === app.options.models.nameProperty)
                    return name;
                if (prop === 'toJson') {
                    if (typeof obj.toJson === 'function')
                        return obj.toJson;
                    else
                        return function () { return JSON.stringify(this); };
                }
                if (typeof obj[prop] === 'object' && obj[prop] != null) {
                    let model = bindOrGet(obj, prop);
                    //let model = null;
                    return model ? model : obj[prop];
                }
                else
                    return obj[prop];
            },
            set: function (obj, prop, value) {
                let previousValue = obj[prop];
                obj[prop] = value;
                models = {};
                //Don't allow DOM update to trigger if value is up-to-date or this model is no longer bound
                if (app.model(name) !== proxy) {
                    return true;
                }
                let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                app.dispatch("set", proxy, propName, previousValue, app.root);
                return true;
            },
            deleteProperty: function (obj, prop) {
                if (prop in obj) {
                    let property = obj[prop];
                    delete obj[prop];
                    if (models[prop] != undefined)
                        delete models[prop];
                    let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                    app.dispatch("unbind", proxy, propName, property, app.root);
                }
                return true;
            }
        });
        return proxy;
    }
    #generateEvents(type, target, modelName, model, propName, searchKey, previousState) {
        const nameParts = modelName.split(this.options.models.nestedOperator);
        const keyParts = searchKey.split(this.options.models.nestedOperator);
        //match on any combination of nested models with wildcards such as: "people.profile.*.info.*""
        if (nameParts.length > keyParts.length) {
            //This even won't concern you
            if (nameParts.length > keyParts.length + 1 && propName !== undefined) {
                return [];
            }
        }
        else if (keyParts.length > nameParts.length) {
            //We are a child of this change, propogate to the correct event that would happen to the child
            switch (type) {
                case "bind":
                case "set":
                    type = "bind";
                    break;
            }
        }
        let name = "";
        let i = 0;
        let localModel = model;
        let localPreviousState = previousState;
        for (i; i < keyParts.length; i++) {
            //If we match, then continue checking for full name
            if (i > 0 && keyParts[i] === this.options.models.wildcardOperator) {
                let reference = type == 'unbind' ? localPreviousState : localModel;
                if (typeof reference === 'object' && reference != null) {
                    return Object.keys(reference).flatMap(x => {
                        let parts = keyParts.map(x => x);
                        parts[i] = x;
                        let key = parts.join(this.options.models.nestedOperator);
                        return this.#generateEvents(type, target, modelName, model, propName, key, previousState);
                    });
                }
                else {
                    return [];
                }
            }
            else if ((i == 0 && keyParts[0] === this.options.models.wildcardOperator)
                || i >= nameParts.length || keyParts[i] === nameParts[i]) {
                if (i == 0) {
                    name = nameParts[i];
                }
                else {
                    name += this.options.models.nestedOperator + keyParts[i];
                    let x = keyParts[i];
                    if (i >= nameParts.length) {
                        localModel = typeof localModel === 'object' && localModel != null
                            ? localModel[x]
                            : undefined;
                        localPreviousState = typeof localPreviousState === 'object' && localPreviousState != null
                            ? localPreviousState[x]
                            : undefined;
                    }
                }
            }
            else {
                //no match
                return [];
            }
            //We reached the end of the model name where the event happens, if this doesn't match then ignore
            if (nameParts.length < keyParts.length && i == nameParts.length - 1) {
                if (keyParts[i + 1] !== propName && keyParts[i + 1] !== this.options.models.wildcardOperator) {
                    //We've reached the end and the prop name doesn't match our path, so ignore
                    return [];
                }
            }
        }
        //We didn't find any relevant data for the model based on the search key
        if (localModel === undefined && previousState === undefined)
            return [];
        if (keyParts.length === nameParts.length) {
            console.log("made it" + `${type}, ${JSON.stringify(localModel)}, ${JSON.stringify(localPreviousState)}, ${propName}, ${target},`);
            return [new HydrateModelEvent(type, localModel, localPreviousState, propName, target, this)];
        }
        else {
            return [new HydrateModelEvent(type, localModel, localPreviousState, undefined, target, this, name)];
        }
        ;
    }
    #mutationCallback(mutations, observer) {
        let bindUpdates = [];
        mutations.forEach(m => {
            // if(m.type === 'childList')
            //     m.addedNodes.forEach(n => this.bindNodeRecursive(n));
            // if(m.type === 'attributes') 
            //     this.bindNodeRecursive(m.target);
        });
    }
    #inputListener(event) {
        let attr = event.target.attributes[this.attribute(this.options.dom.attributes.model)];
        let input = event.target.attributes[this.attribute(this.options.dom.attributes.model)];
        if (attr != null && input != null) {
            let model = this.model(attr.value);
            if (model) {
                let args = input.value.split(" ");
                model[args[0]] = event.target[args[1]];
            }
        }
    }
    /** Updates the DOM using the provided model event */
    #dom(event, target) {
        if (target == null)
            target = this.root;
        let partOfTemplate = target;
        do {
            //Don't trigger an event if it's inside a template
            if (partOfTemplate.attributes[this.attribute(this.options.dom.attributes.template)])
                return;
            partOfTemplate = partOfTemplate.parentElement;
        } while (partOfTemplate !== null);
        //Determine how to update our DOM
        var attributes = this.#loadDomAttributes(target);
        let responded = false;
        if (attributes.attribute !== undefined)
            responded = this.#updateHTMLAttribute(target, event, attributes) || responded;
        if (attributes.property !== undefined)
            responded = this.#updateHTMLProperty(target, event, attributes) || responded;
    }
    #loadDomAttributes(target) {
        const app = this;
        let getArguments = function (target, name) {
            let attribute = target.attributes[app.attribute(name)];
            if (attribute === undefined)
                return undefined;
            return app.#splitAttributeValue(attribute.value);
        };
        let attributes = new HydrateDomUpdateAttributes();
        attributes.model = getArguments(target, this.options.dom.attributes.model);
        attributes.attribute = getArguments(target, this.options.dom.attributes.attribute);
        attributes.property = getArguments(target, this.options.dom.attributes.property);
        return attributes;
    }
    #splitAttributeValue(value) {
        if (value == null)
            return undefined;
        //return value.split(/({{.+}})?;/).filter(x => x !== undefined).map(x => { 
        return value.split(';').map(x => {
            //return x.trim().split(/\s+/)
            let baseParams = x.trim();
            //splits on two whitespaces: "[model_prop] [el_prop] [THIRD_PARAM]"
            let regParams = baseParams.match(/[^\s]+\s+[^\s]+\s+/);
            if (!regParams) {
                let args = baseParams.split(/\s+/);
                return new HydrateDomAttributeArguments(args[0], args[1], undefined);
            }
            //We have a 3rd argument for a replacement/insertion value to stick into arg 2 field
            let result = baseParams.split(/\s+/);
            return new HydrateDomAttributeArguments(result[0], result[1], baseParams.substring(regParams[0].length));
        });
    }
    //******** HTML DOM MANIUPLATIONS *****//
    #updateHTMLAttribute(target, event, attributes) {
        const wildcard = this.options.models.wildcardOperator;
        let updated = false;
        attributes.attribute.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate attribute for element ${target}`);
                return;
            }
            //Determine the value we need to evaluate
            let prop;
            if (event.propName === undefined) {
                if (arg.arg1 !== wildcard) {
                    if (typeof event.state === 'object') {
                        prop = event.state[arg.arg1];
                    }
                    else
                        return;
                }
                else {
                    if (typeof event.state === 'object') {
                        let keys = Object.keys(event.state);
                        prop = keys[keys.length - 1];
                    }
                    else
                        prop = event.state;
                }
            }
            else if (arg.arg1 === event.propName)
                prop = event.prop;
            //This event doesn't match, so ignore
            else
                return;
            if (target.attributes[arg.arg2]?.value !== prop) {
                target.setAttribute(arg.arg2, prop);
            }
            updated = true;
        });
        return updated;
    }
    #updateHTMLProperty(target, event, attributes) {
        const wildcard = this.options.models.wildcardOperator;
        let updated = false;
        attributes.property.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate property for element ${target}`);
                return;
            }
            //Determine the value we need to evaluate
            let prop;
            if (event.propName === undefined) {
                if (arg.arg1 !== wildcard) {
                    if (typeof event.state === 'object') {
                        prop = event.state[arg.arg1];
                    }
                    else
                        return;
                }
                else {
                    if (typeof event.state === 'object') {
                        let keys = Object.keys(event.state);
                        prop = keys[keys.length - 1];
                    }
                    else
                        prop = event.state;
                }
            }
            else if (arg.arg1 === event.propName)
                prop = event.prop;
            //This event doesn't match, so ignore
            else
                return;
            if (target[arg.arg2] !== prop) {
                target[arg.arg2] = prop;
                // console.log(event);
                // console.log(target);
                // console.log(prop);
            }
            updated = true;
        });
        return updated;
    }
}
