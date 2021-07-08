function AppTestOption(test, parameters, publicMethods, staticMethods) {
    this.test = test;
    this.parameters = parameters ? parameters : [];
    this.publicMethods = publicMethods === false ? false : true;
    this.staticMethods = staticMethods === true ? true : false;
}

function AppTestCase(object, className, methodName, options) {
    this.object = object;// != undefined ? classType : window;
    this.className = className
    this.methodName = methodName;
    this.options = options;
}
AppTestCase.prototype.toString = function() {
    return this.className + "." + this.methodName;
}

function AppTestResult(testCase) {
    this.testCase = testCase;
    this.startTime = null;
    this.endTime = null;
    this.error = null;
    this.passed = false;
}
AppTestResult.prototype.getRunTime = function() {
    return this.endTime - this.startTime.getTime();
}
AppTestResult.prototype.getRunTimeDisplay = function() {
    let time = this.getRunTime();
    return AppTester.getTimeDisplay(time);
}
AppTestResult.prototype.toString = function() {
    let text = this.testCase.toString() + ", ";
    if(this.passed)
        return text + "Passed, Run Time - " + this.getRunTimeDisplay();
    return text + "Failed, "+ this.error.toString();
}

function AppTestResultsSummary(testResults) {
    this.testResults = testResults;
    this.totalTest = testResults.length;
    this.testPassed = testResults.filter(x => x.passed).length;
    this.testFailed = testResults.filter(x => !x.passed).length;
    this.totalTestTime = testResults.reduce((total, x) => total + x.getRunTime(), 0);
}
AppTestResultsSummary.prototype.getformatedResults = function() {
    let text = "Test cases: " + this.totalTest + ", Passed: " + this.testPassed + ", Failed: " + this.testFailed
        + ", Run time: " + AppTester.getTimeDisplay(this.totalTestTime) + "\n";
    text += "Results cases:";
    this.testResults.forEach(x => text += "\n" + x.toString());
    return text;
} 

function AppTester() {
    return Promise(resolve => {setTimeout(500, resolve())});
}
AppTester.getTimeDisplay = function(time) {
    return Math.floor(time / 3600000) + ":" + Math.floor(time / 60000)%60 + ":" + Math.floor(time / 1000)%60 + ":" + (time % 1000)
}
AppTester.getClassName = function(classType) {
    let text = classType.toString();
    let index = text.indexOf("(");
    let start = "function ".length;
    return text.substr(start, index - start);
}
AppTester.test = async function(testCases) {
    let testResults = [];
    for(let i = 0; i < testCases.length; i++)
    {
        let testCase = testCases[i];
        let testResult = new AppTestResult(testCase);
        testResults.push(testResult);
        try {
            testResult.startTime = new Date();
            await testCase.object[testCase.methodName].apply(this, testCase.parameters);
            testResult.endTime = new Date();
            testResult.passed = true;
        }
        catch (error) {
            testResult.endTime = new Date();
            testResult.passed = false;
            testResult.error = error;
        }
    }
    return new AppTestResultsSummary(testResults);
}

AppTester.testClass = async function(testOptions) {
    let testCases = [];
    for(let i = 0; i < testOptions.length; i++) {
        let options = testOptions[i];
        let classType = options.test;
        let className = AppTester.getClassName(classType);
        if(options.publicMethods)
            Object.keys(classType.prototype).forEach(method => {
                if(!(classType.prototype[method] instanceof Function))
                    return;
                if(method.match(/^[Aa]ssert/))
                    testCases.push(new AppTestCase(new classType(), className, method, options));
            })
        if(options.staticMethods)
            Object.keys(classType).forEach(method => {
                if(!(classType[method] instanceof Function))
                    return;
                if(method.match(/^[Tt]est/))
                    testCases.push(new AppTestCase(classType, className, method, options));
            })
    }
    return AppTester.test(testCases);
}

//Assertion
function AssertionError(message, fileName, lineNumber) {
    var instance = new Error("Assertion failed - " + message, fileName, lineNumber);
    instance.name = 'AssertionError';
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    if (Error.captureStackTrace) {
        Error.captureStackTrace(instance, AssertionError);
    }
    return instance;
}
AssertionError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: Error,
        enumerable: false,
        writable: true,
        configurable: true
    }
});


function AssertionHelper() {

}
AssertionHelper.valueToString = function(value) {
    let text = value instanceof Object && value.toString ? value.toString() : value;
    if(text !== "[object Object]")
        return text;
    return JSON.stringify(value);
}
AssertionHelper.getClassName = function(classType) {
    if(!(classType instanceof Object))
        return classType;
    let text = classType.toString();
    let index = text.indexOf("(");
    let start = "function ".length;
    return text.substr(start, index - start);
}
AssertionHelper.checkPropertiesRecursive = function(object1, object1Name, object2, object2Name, evaluationFunction) {
    //console.log(AssertionHelper.valueToString(object1) + ", " + AssertionHelper.valueToString(object2));
    if(object1 == object2)
        return null;
    if((object1 !== undefined) !== (object2 !== undefined))
    {
        if(object1 === undefined)
            return "'" + object1.name + "' is not a undefined while '" + object2Name + "' is"
        return "'" + object2.name + "' is not a undefined while '" + object1Name + "' is"
    }
    if((object1 instanceof Object) !== (object2 instanceof Object))
    {
        if(object1 instanceof Object)
            return "'" + object1.name + "' is an object while '" + object2Name + "' is not"
        return "'" + object2.name + "' is an object while '" + object1Name + "' is not"
    }
    if(!(object1 instanceof Object))
    {
        try {

            if(evaluationFunction(object1, object2))
            {
                let result = AssertionHelper.checkPropertiesRecursive(object1[key], object1Name + "." + key
                    , object2[key], object2Name + "." + key, evaluationFunction);
                if(result)
                    return result;
                else return null;
            }
            else
                return "valuation for '" + object1Name + "' '" + object2Name
                + "' equaled false for the following evaluation '" + AssertionHelper.valueToString(evaluationFunction) + "'"
                + " for values '" + AssertionHelper.valueToString(object1) + "' and " + AssertionHelper.valueToString(object2) + "'";
        }
        catch (error) {
            return "evaluation for '" + object1Name + "' '" + object2Name
                + "' failed for the following evaluation '" + AssertionHelper.valueToString(evaluationFunction) + "'"
                + " with the error: " + AssertionHelper.valueToString(error)
                + " for values '" + AssertionHelper.valueToString(object1) + "' and " + AssertionHelper.valueToString(object2) + "'";
        }
    }
    if((object1 instanceof Function) !== (object2 instanceof Function))
    {
        if(object1 instanceof Function)
            return "'" + object1.name + "' is a function while '" + object2Name + "' is not"
        return "'" + object2.name + "' is a function while '" + object1Name + "' is not"
    }
    let keys = Object.keys(object2);
    for(let i = 0; i < keys.length; i++)
    {
        let key = keys[i];
        let result = AssertionHelper.checkPropertiesRecursive(object1[key], object1Name + "." + key
            , object2[key], object2Name + "." + key, evaluationFunction);
        if(result)
            return result;
    }
    return null;
}

function Assert() {

}



Assert.false = function(message) {
    throw new AssertionError(message);
}
Assert.expression = function(expression) {
    if(expression == true)
        return true;
    let message = AssertionHelper.valueToString(expression);
    throw new AssertionError("Assert.expression expression: '" + message + "' evaulated to false");
}
Assert.hasValue = function(value) {
    let message = "Assert.hasValue resulted in false. Value is "
    if(value === null)
        throw new AssertionError(message + " null");
    if(value == undefined)  
        throw new AssertionError(message + " undefined");
    if(value === NaN)
        throw new AssertionError(message + " NaN");
    if(value === Infinity)
        throw new AssertionError(message + " Infinity");
    if(value === "")
        throw new AssertionError(message + " empty string");
    if(Array.isArray(value) && value.length === 0)
        throw new AssertionError(message + " empty array");
    if(value instanceof Object && Object.keys(value).length === 0)
        throw new AssertionError(message + " empty dictionary");
    return true;
}
Assert.hasNoValue = function(value) {
    try {
        Assert.hasValue(value);
        throw new AssertionError("Assert.hasNoValue variable has a value: '" + AssertionHelper.valueToString(value) + "'");
    }
    catch {
        return true;
    }
}
Assert.throwsError = function(func) {
    let message = AssertionHelper.valueToString(func);
    message = "Assert.throwsError function: '" + message + "' did not throw an error"
    try {
        let result = func();
        if(result instanceof Promise)
            return result
            .then(res => {
                throw new AssertionError(message);
            })
            .catch(error => true);
        throw new AssertionError(error);
    }
    catch (error) {
        return true;
    }
}
Assert.isInstanceOf = function(value, type) {
    if(value instanceof type)
        return true;
    let text1 = AssertionHelper.valueToString(value);
    let text2 = AssertionHelper.getClassName(type);
    throw new AssertionError("Assert.isInstanceOf value: '" + text1 + "' is not of type '" + text2 + "'");
}
Assert.isTypeOf = function(value, type) {
    if(typeof value === type)
        return true;
    let text1 = AssertionHelper.valueToString(value);
    let text2 = AssertionHelper.valueToString(type);
    throw new AssertionError("Assert.isTypeOf value: '" + text1 + "' is not of type '" + text2 + "'");
}
Assert.hasProperties = function(object, properties) {
    let message = AssertionHelper.checkPropertiesRecursive(object, "object", properties, "properties", (x, y) => true);
    if(!message)
        return true;
    throw new AssertionError("Assert.hasProperties evaluated to false because: " + message);
}
Assert.propertiesEqual = function(object, properties) {
    let message = AssertionHelper.checkPropertiesRecursive(object, "object", properties, "properties", (x, y) => x == y);
    if(!message)
        return true;
    throw new AssertionError("Assert.propertiesEqual evaluated to false because: " + message);
}
Assert.hasStructure = function(value1, value2) {
    if(value1 instanceof Object !== value2 instanceof Object) {
        throw new AssertionError("Assert.hasStructure evaluated to false due to '" + AssertionHelper.valueToString(value1)
            + "' instanceOf Object === " + (value1 instanceof Object) + " and '" + AssertionHelper.valueToString(value2)
            + "' instanceOf Object === " + (value2 instanceof Object));
    }
    let message = AssertionHelper.checkPropertiesRecursive(value1, "value1", value2, "value2", (x, y) => true);
    if(message)
        throw new AssertionError("Assert.equals failed because: '" + message);
    
    let matchKeys = function(obj1, obj2, name) {
        if(obj1 instanceof Object === false)
            return null;
        let keys1 = Object.keys(obj1);
        for(let i = 0; i < keys1.length; i++) {
            let key = keys1[i];
            if(obj1[key] instanceof Function === false) {
                // console.log("checking key: " + key);
                // console.log(obj2[key]);
                if(obj2[key] === undefined) {
                    return name + "." + key;
                }
                let result = matchKeys(obj1[key], obj2[key], name + "." + key);
                if(result != null)
                    return result;
            }
        }
        return null;
    }
    let badKey = matchKeys(value1, value2, "value1");
    if(badKey == null)
        return true;
    throw new AssertionError("Assert.hasStructure evaluated to false because the structure value1 contains key '"
        + badKey + "' while value2 does not for the properties: '"
        + AssertionHelper.valueToString(value1) + "' and '" + AssertionHelper.valueToString(value2) + "'");
}
Assert.equals = function(value1, value2) {
    if(typeof value1 !== typeof value2) {
        throw new AssertionError("Assert.equals evaluated to false due to a type mismatch of '"
            + typeof value1 + "'  and '" + typeof value2 + "' between '" +
            AssertionHelper.valueToString(value1) + "' and '" + AssertionHelper.valueToString(value2) + "'");
    }
    let message = AssertionHelper.checkPropertiesRecursive(value1, "value1", value2, "value2", (x, y) => {
        console.log("evaluating " + x + " + " + y);
        return x == y});
    if(!message)
        return true;
    throw new AssertionError("Assert.equals failed because: '" + message);
}