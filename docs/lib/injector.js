function AppDependency(classType, singleton) {
    this.classType = classType;
    this.instance = null;
    this.singleton = singleton == true ? true : false;
}

function DependencyInjectionError(message, fileName, lineNumber) {
    var instance = new Error("Dependency injection failed - " + message, fileName, lineNumber);
    instance.name = 'DependencyInjectionError';
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    if (Error.captureStackTrace) {
        Error.captureStackTrace(instance, DependencyInjectionError);
    }
    return instance;
}
DependencyInjectionError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: Error,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

function DependencyInjector() {
    this.dependencies = {};
}
DependencyInjector.getClassName = function(classType) {
    if(!(classType instanceof Object))
        return classType;
    let text = classType.toString();
    let index = text.indexOf("(");
    let start = "function ".length;
    return text.substr(start, index - start);
}
DependencyInjector.getFunctionArguments = function(func) {
    return func.toString()
        .replace(/[/][/].*$/mg,'') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
        .replace(/=[^,]+/g, '') // strip any ES6 defaults  
        .split(',').filter(x => x !== ""); // split & filter [""]
}
DependencyInjector.prototype.addSingleton = function(classType, name) {
    if(name == undefined)
        name = DependencyInjector.getClassName(classType);
    name = name.toLowerCase();
    this.dependencies[name] = new AppDependency(classType, true);
}
DependencyInjector.prototype.addScoped = function(classType, name) {
    if(name == undefined)
        name = DependencyInjector.getClassName(classType);
    name = name.toLowerCase();
    this.dependencies[name] = new AppDependency(classType, true);
}
DependencyInjector.prototype.getDependency = function(name) {
    if(name instanceof Function)
        name = DependencyInjector.getClassName(name);
    let dependency = this.dependencies[name];
    if(dependency === undefined)
        throw new DependencyInjectionError("dependency does not exist for name '" + name + "'");
    
    if(!dependency.singleton || dependency.instance == undefined)
        dependency.instance = this.createInstance(dependency.classType);
    return dependency.instance;
}
DependencyInjector.prototype.createInstance = function(classType) {
    let injector = this;
    let args = DependencyInjector.getFunctionArguments(classType)
        .map(x => injector.getDependency(x));
    return new classType(... args);
}